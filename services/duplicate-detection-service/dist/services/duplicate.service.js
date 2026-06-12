"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForDuplicates = checkForDuplicates;
exports.getDuplicateAlerts = getDuplicateAlerts;
exports.resolveDuplicate = resolveDuplicate;
const database_1 = require("../config/database");
// ─────────────────────────────────────────────────────────────────────────────
// Duplicate Detection Engine
// Multi-field fuzzy matching with weighted similarity scoring
// ─────────────────────────────────────────────────────────────────────────────
async function checkForDuplicates(input) {
    // Fetch candidate invoices (excluding the current one)
    const candidates = await (0, database_1.query)(`SELECT id, invoice_number, vendor_name, total_amount, invoice_date, po_number
     FROM invoices
     WHERE id != $1
       AND status NOT IN ('rejected','fraud_suspected')
       AND created_at >= NOW() - INTERVAL '365 days'
     ORDER BY created_at DESC
     LIMIT 500`, [input.invoiceId]);
    let bestMatch = null;
    for (const candidate of candidates.rows) {
        const result = computeSimilarity(input, candidate);
        if (!bestMatch || result.score > bestMatch.score) {
            bestMatch = { id: candidate.id, score: result.score, fields: result.fields, fieldScores: result.fieldScores };
        }
    }
    const similarity = bestMatch?.score || 0;
    const isDuplicate = similarity >= 80;
    const isNear = similarity >= 60 && similarity < 80;
    const isSimilar = similarity >= 40 && similarity < 60;
    const duplicateType = isDuplicate ? 'exact' : isNear ? 'near_duplicate' : isSimilar ? 'similar' : undefined;
    const riskScore = Math.min(100, Math.round(similarity));
    const alertRaised = similarity >= 60;
    // Persist result
    if (bestMatch && similarity >= 40) {
        await (0, database_1.query)(`INSERT INTO duplicate_detection_results
         (invoice_id, compared_invoice_id, duplicate_type, risk_score, similarity_percentage, matching_fields, field_scores, is_duplicate, alert_raised)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
            input.invoiceId,
            bestMatch.id,
            duplicateType || 'similar',
            riskScore,
            similarity,
            JSON.stringify(bestMatch.fields),
            JSON.stringify(bestMatch.fieldScores),
            isDuplicate,
            alertRaised,
        ]);
    }
    return {
        invoiceId: input.invoiceId,
        isDuplicate,
        duplicateType,
        riskScore,
        similarityPercentage: parseFloat(similarity.toFixed(1)),
        matchedInvoiceId: bestMatch?.id,
        matchingFields: bestMatch?.fields || [],
        fieldScores: bestMatch?.fieldScores || {},
        alertRaised,
    };
}
function computeSimilarity(input, candidate) {
    const fields = [];
    const fieldScores = {};
    // Field weights (must sum to 100)
    const WEIGHTS = {
        invoiceNumber: 35,
        vendorName: 20,
        totalAmount: 25,
        invoiceDate: 10,
        poNumber: 10,
    };
    let totalScore = 0;
    // Invoice Number (exact match = 100, else 0)
    if (input.invoiceNumber && candidate.invoice_number) {
        const s = input.invoiceNumber.trim().toLowerCase() === candidate.invoice_number.trim().toLowerCase() ? 100 : 0;
        if (s > 0) {
            fields.push('invoice_number');
            fieldScores.invoiceNumber = s;
        }
        totalScore += (s * WEIGHTS.invoiceNumber) / 100;
    }
    // Vendor Name (fuzzy)
    if (input.vendorName && candidate.vendor_name) {
        const s = stringSimilarity(input.vendorName, candidate.vendor_name);
        if (s > 60) {
            fields.push('vendor_name');
            fieldScores.vendorName = s;
        }
        totalScore += (s * WEIGHTS.vendorName) / 100;
    }
    // Total Amount (within 1% = 100, within 5% = 70, else 0)
    if (input.totalAmount != null && candidate.total_amount != null) {
        const diff = Math.abs(input.totalAmount - parseFloat(candidate.total_amount));
        const pct = diff / (parseFloat(candidate.total_amount) || 1);
        const s = pct < 0.01 ? 100 : pct < 0.05 ? 70 : pct < 0.1 ? 30 : 0;
        if (s > 0) {
            fields.push('total_amount');
            fieldScores.totalAmount = s;
        }
        totalScore += (s * WEIGHTS.totalAmount) / 100;
    }
    // Invoice Date (same day = 100, within 3 days = 50)
    if (input.invoiceDate && candidate.invoice_date) {
        const d1 = new Date(input.invoiceDate).getTime();
        const d2 = new Date(candidate.invoice_date).getTime();
        const daysDiff = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
        const s = daysDiff === 0 ? 100 : daysDiff <= 3 ? 50 : 0;
        if (s > 0) {
            fields.push('invoice_date');
            fieldScores.invoiceDate = s;
        }
        totalScore += (s * WEIGHTS.invoiceDate) / 100;
    }
    // PO Number (exact match)
    if (input.poNumber && candidate.po_number) {
        const s = input.poNumber.trim().toLowerCase() === candidate.po_number.trim().toLowerCase() ? 100 : 0;
        if (s > 0) {
            fields.push('po_number');
            fieldScores.poNumber = s;
        }
        totalScore += (s * WEIGHTS.poNumber) / 100;
    }
    return { score: Math.min(100, Math.round(totalScore)), fields, fieldScores };
}
// Simple character-level similarity (Dice coefficient)
function stringSimilarity(a, b) {
    a = a.toLowerCase().trim();
    b = b.toLowerCase().trim();
    if (a === b)
        return 100;
    if (a.length < 2 || b.length < 2)
        return 0;
    const bigrams = new Map();
    for (let i = 0; i < a.length - 1; i++) {
        const bg = a.substring(i, i + 2);
        bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
    }
    let intersectionSize = 0;
    for (let i = 0; i < b.length - 1; i++) {
        const bg = b.substring(i, i + 2);
        if ((bigrams.get(bg) || 0) > 0) {
            intersectionSize++;
            bigrams.set(bg, bigrams.get(bg) - 1);
        }
    }
    return Math.round((2 * intersectionSize) / (a.length + b.length - 2) * 100);
}
async function getDuplicateAlerts() {
    const result = await (0, database_1.query)(`
    SELECT ddr.*, i.invoice_number, i.vendor_name, i.total_amount, i.status,
           ci.invoice_number AS compared_invoice_number
    FROM duplicate_detection_results ddr
    JOIN invoices i ON ddr.invoice_id = i.id
    LEFT JOIN invoices ci ON ddr.compared_invoice_id = ci.id
    WHERE ddr.alert_raised = true AND ddr.resolution_status = 'pending'
    ORDER BY ddr.detected_at DESC
  `);
    return result.rows;
}
async function resolveDuplicate(id, status, resolvedBy, notes) {
    await (0, database_1.query)(`UPDATE duplicate_detection_results
     SET resolution_status = $2, resolved_by = $3, resolved_at = NOW(), notes = $4
     WHERE id = $1`, [id, status, resolvedBy, notes || null]);
}
//# sourceMappingURL=duplicate.service.js.map