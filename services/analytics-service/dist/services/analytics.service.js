"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardKPIs = getDashboardKPIs;
exports.getSpendAnalytics = getSpendAnalytics;
exports.getFraudAnalytics = getFraudAnalytics;
exports.getAuditLogs = getAuditLogs;
const database_1 = require("../config/database");
async function getDashboardKPIs() {
    const [invoiceTotals, fraudStats, vendorStats, approvalStats, monthlySpend, topVendors, recentActivity,] = await Promise.all([
        (0, database_1.query)(`
      SELECT
        COUNT(*) AS total_invoices,
        COUNT(*) FILTER (WHERE status = 'approved') AS approved,
        COUNT(*) FILTER (WHERE status IN ('pending_review','fraud_check','duplicate_check','ocr_complete')) AS pending,
        COUNT(*) FILTER (WHERE status = 'fraud_suspected') AS fraud_suspected,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'approved'), 0) AS total_approved_spend,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'pending_review'), 0) AS total_pending_spend,
        COALESCE(AVG(total_amount), 0) AS avg_invoice_amount,
        COALESCE(AVG(ocr_confidence), 0) AS avg_ocr_confidence
      FROM invoices
    `),
        (0, database_1.query)(`
      SELECT
        COUNT(*) AS total_analyzed,
        COUNT(*) FILTER (WHERE risk_level = 'critical') AS critical,
        COUNT(*) FILTER (WHERE risk_level = 'high') AS high,
        COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium,
        COUNT(*) FILTER (WHERE risk_level = 'low') AS low,
        COALESCE(AVG(risk_score), 0) AS avg_risk_score
      FROM fraud_scores
    `),
        (0, database_1.query)(`
      SELECT
        COUNT(*) AS total_vendors,
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE status = 'under_review') AS under_review,
        COUNT(*) FILTER (WHERE risk_score >= 50) AS high_risk_vendors,
        COALESCE(SUM(total_spend), 0) AS total_vendor_spend
      FROM vendors
    `),
        (0, database_1.query)(`
      SELECT
        COUNT(*) AS total_workflows,
        COUNT(*) FILTER (WHERE status = 'approved') AS approved,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
        COUNT(*) FILTER (WHERE status IN ('pending_review','in_progress')) AS pending
      FROM approval_workflows
    `),
        (0, database_1.query)(`
      SELECT
        DATE_TRUNC('month', invoice_date) AS month,
        COUNT(*) AS invoice_count,
        COALESCE(SUM(total_amount), 0) AS total_spend,
        COALESCE(AVG(total_amount), 0) AS avg_amount
      FROM invoices
      WHERE invoice_date >= NOW() - INTERVAL '12 months'
        AND status != 'rejected'
      GROUP BY month
      ORDER BY month ASC
    `),
        (0, database_1.query)(`
      SELECT
        vendor_name,
        COUNT(*) AS invoice_count,
        COALESCE(SUM(total_amount), 0) AS total_spend,
        COALESCE(AVG(total_amount), 0) AS avg_amount,
        MAX(fraud_risk_score) AS max_fraud_score
      FROM invoices
      WHERE status != 'rejected' AND vendor_name IS NOT NULL
      GROUP BY vendor_name
      ORDER BY total_spend DESC
      LIMIT 10
    `),
        (0, database_1.query)(`
      SELECT id, invoice_number, vendor_name, total_amount, status, fraud_risk_level, created_at
      FROM invoices
      ORDER BY created_at DESC
      LIMIT 10
    `),
    ]);
    return {
        invoiceTotals: invoiceTotals.rows[0],
        fraudStats: fraudStats.rows[0],
        vendorStats: vendorStats.rows[0],
        approvalStats: approvalStats.rows[0],
        monthlySpend: monthlySpend.rows,
        topVendors: topVendors.rows,
        recentActivity: recentActivity.rows,
    };
}
async function getSpendAnalytics(period = '12months') {
    const interval = period === '3months' ? '3 months' : period === '6months' ? '6 months' : '12 months';
    const [byCategory, byStatus, byVendorCategory, spendTrend] = await Promise.all([
        (0, database_1.query)(`
      SELECT
        COALESCE(v.category, 'Uncategorized') AS category,
        COUNT(i.id) AS invoice_count,
        COALESCE(SUM(i.total_amount), 0) AS total_spend,
        COALESCE(AVG(i.total_amount), 0) AS avg_amount
      FROM invoices i
      LEFT JOIN vendors v ON i.vendor_id = v.id
      WHERE i.invoice_date >= NOW() - INTERVAL '${interval}'
        AND i.status = 'approved'
      GROUP BY v.category
      ORDER BY total_spend DESC
    `),
        (0, database_1.query)(`
      SELECT
        status,
        COUNT(*) AS count,
        COALESCE(SUM(total_amount), 0) AS total_amount
      FROM invoices
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY status
    `),
        (0, database_1.query)(`
      SELECT
        COALESCE(v.country, 'Unknown') AS country,
        COUNT(i.id) AS invoice_count,
        COALESCE(SUM(i.total_amount), 0) AS total_spend
      FROM invoices i
      LEFT JOIN vendors v ON i.vendor_id = v.id
      WHERE i.invoice_date >= NOW() - INTERVAL '${interval}'
      GROUP BY v.country
      ORDER BY total_spend DESC
    `),
        (0, database_1.query)(`
      SELECT
        DATE_TRUNC('week', invoice_date) AS week,
        COUNT(*) AS invoice_count,
        COALESCE(SUM(total_amount), 0) AS total_spend
      FROM invoices
      WHERE invoice_date >= NOW() - INTERVAL '${interval}'
        AND status != 'rejected'
      GROUP BY week
      ORDER BY week ASC
    `),
    ]);
    return {
        byCategory: byCategory.rows,
        byStatus: byStatus.rows,
        byCountry: byVendorCategory.rows,
        spendTrend: spendTrend.rows,
    };
}
async function getFraudAnalytics() {
    const [trends, byLevel, highRiskVendors, recentAlerts] = await Promise.all([
        (0, database_1.query)(`
      SELECT
        DATE_TRUNC('month', analyzed_at) AS month,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE risk_level = 'critical') AS critical,
        COUNT(*) FILTER (WHERE risk_level = 'high') AS high,
        COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium,
        COUNT(*) FILTER (WHERE risk_level = 'low') AS low,
        AVG(risk_score) AS avg_score
      FROM fraud_scores
      WHERE analyzed_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `),
        (0, database_1.query)(`
      SELECT risk_level, COUNT(*) AS count, AVG(risk_score) AS avg_score
      FROM fraud_scores
      GROUP BY risk_level
    `),
        (0, database_1.query)(`
      SELECT
        i.vendor_name,
        COUNT(fs.id) AS assessments,
        AVG(fs.risk_score) AS avg_risk_score,
        MAX(fs.risk_score) AS max_risk_score
      FROM fraud_scores fs
      JOIN invoices i ON fs.invoice_id = i.id
      WHERE i.vendor_name IS NOT NULL
      GROUP BY i.vendor_name
      HAVING AVG(fs.risk_score) > 30
      ORDER BY avg_risk_score DESC
      LIMIT 10
    `),
        (0, database_1.query)(`
      SELECT fs.*, i.invoice_number, i.vendor_name, i.total_amount
      FROM fraud_scores fs
      JOIN invoices i ON fs.invoice_id = i.id
      WHERE fs.risk_level IN ('high', 'critical')
      ORDER BY fs.analyzed_at DESC
      LIMIT 10
    `),
    ]);
    return {
        trends: trends.rows,
        byLevel: byLevel.rows,
        highRiskVendors: highRiskVendors.rows,
        recentAlerts: recentAlerts.rows,
    };
}
async function getAuditLogs(filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    let whereClause = `WHERE 1=1`;
    const params = [];
    let paramIndex = 1;
    if (filters.entityType) {
        whereClause += ` AND entity_type = $${paramIndex++}`;
        params.push(filters.entityType);
    }
    if (filters.userId) {
        whereClause += ` AND user_id = $${paramIndex++}`;
        params.push(filters.userId);
    }
    if (filters.action) {
        whereClause += ` AND action ILIKE $${paramIndex++}`;
        params.push(`%${filters.action}%`);
    }
    const countResult = await (0, database_1.query)(`SELECT COUNT(*) FROM audit_logs ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await (0, database_1.query)(`SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
    return { logs: result.rows, total, page, limit };
}
//# sourceMappingURL=analytics.service.js.map