import { query } from '../config/database';
import { enhanceFraudAnalysis } from './gemini.service';

export interface FraudAnalysisResult {
  invoiceId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  fraudIndicators: string[];
  anomalyDetails: Record<string, any>;
  explanation: string;
  recommendations: string[];
  recommendation: 'approve' | 'reject' | 'manual_review';
  confidence: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Fraud Detection Engine
// Analyzes multiple risk dimensions and generates explainable risk scores
// In production: integrate with Azure ML / custom trained models
// ─────────────────────────────────────────────────────────────────────────────
export async function analyzeInvoice(
  invoiceId: string,
  ocrData: any
): Promise<FraudAnalysisResult> {

  const indicators: string[] = [];
  const anomalyDetails: Record<string, any> = {};
  let riskScore = 0;

  // ── 1. Vendor History Analysis ─────────────────────────────────
  const vendorHistory = await getVendorHistory(ocrData.vendorName);
  if (vendorHistory) {
    const avgAmount = vendorHistory.avgAmount;
    const totalInv  = vendorHistory.totalInvoices;

    if (totalInv < 3) {
      riskScore += 20;
      indicators.push('new_vendor');
      anomalyDetails.vendorNewness = { invoiceCount: totalInv, threshold: 3 };
    }

    if (avgAmount && ocrData.totalAmount > avgAmount * 3) {
      riskScore += 25;
      indicators.push('unusual_amount');
      anomalyDetails.amountAnomaly = {
        invoiceAmount: ocrData.totalAmount,
        vendorAverage: avgAmount,
        multiplier: (ocrData.totalAmount / avgAmount).toFixed(1),
      };
    }
  }

  // ── 2. Amount Pattern Analysis ─────────────────────────────────
  if (ocrData.totalAmount > 50000) {
    riskScore += 10;
    indicators.push('high_value_invoice');
    anomalyDetails.highValue = { amount: ocrData.totalAmount, threshold: 50000 };
  }

  if (ocrData.totalAmount && ocrData.totalAmount % 1000 === 0) {
    riskScore += 8;
    indicators.push('round_number_amount');
    anomalyDetails.roundAmount = { amount: ocrData.totalAmount };
  }

  // ── 3. Tax Validation ──────────────────────────────────────────
  if (ocrData.taxAmount === 0 && ocrData.totalAmount > 1000) {
    riskScore += 15;
    indicators.push('zero_tax_high_value');
    anomalyDetails.zeroTax = { totalAmount: ocrData.totalAmount };
  }

  const expectedTax = ocrData.subtotal ? ocrData.subtotal * 0.1 : 0;
  if (expectedTax && ocrData.taxAmount && Math.abs(ocrData.taxAmount - expectedTax) > expectedTax * 0.5) {
    riskScore += 12;
    indicators.push('tax_discrepancy');
    anomalyDetails.taxDiscrepancy = {
      declared: ocrData.taxAmount,
      expected: expectedTax,
      variance: Math.abs(ocrData.taxAmount - expectedTax).toFixed(2),
    };
  }

  // ── 4. PO Number Validation ────────────────────────────────────
  if (!ocrData.poNumber) {
    riskScore += 10;
    indicators.push('missing_po_number');
  }

  // ── 5. Date Anomalies ──────────────────────────────────────────
  if (ocrData.invoiceDate && ocrData.dueDate) {
    const invDate = new Date(ocrData.invoiceDate);
    const dueDate = new Date(ocrData.dueDate);
    const daysDiff = (dueDate.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff < 0) {
      riskScore += 20;
      indicators.push('due_date_before_invoice_date');
      anomalyDetails.dateAnomaly = { invoiceDate: ocrData.invoiceDate, dueDate: ocrData.dueDate };
    }
    if (daysDiff === 0) {
      riskScore += 15;
      indicators.push('same_day_payment_demand');
    }
  }

  // ── 6. Recent Frequency Analysis ──────────────────────────────
  const recentCount = await getRecentInvoiceCount(ocrData.vendorName, 7);
  if (recentCount >= 5) {
    riskScore += 15;
    indicators.push('frequency_anomaly');
    anomalyDetails.frequencyAnomaly = { invoicesLast7Days: recentCount, threshold: 5 };
  }

  // ── 7. OCR Confidence Impact ───────────────────────────────────
  if (ocrData.confidence && ocrData.confidence < 70) {
    riskScore += 10;
    indicators.push('low_ocr_confidence');
    anomalyDetails.lowConfidence = { score: ocrData.confidence, threshold: 70 };
  }

  // Cap at 100
  riskScore = Math.min(Math.round(riskScore), 100);

  const riskLevel: FraudAnalysisResult['riskLevel'] =
    riskScore >= 75 ? 'critical' :
    riskScore >= 50 ? 'high' :
    riskScore >= 25 ? 'medium' : 'low';

  const recommendation: FraudAnalysisResult['recommendation'] =
    riskLevel === 'critical' ? 'reject' :
    riskLevel === 'high'     ? 'manual_review' :
    riskScore >= 15          ? 'manual_review' : 'approve';

  let explanation = generateExplanation(riskScore, riskLevel, indicators, anomalyDetails);
  let recommendations = generateRecommendations(riskLevel, indicators);
  const confidence = parseFloat((85 + (100 - riskScore) * 0.1).toFixed(1));

  const baseResult: FraudAnalysisResult = {
    invoiceId,
    riskScore,
    riskLevel,
    fraudIndicators: indicators,
    anomalyDetails,
    explanation,
    recommendations,
    recommendation,
    confidence,
  };

  const geminiEnhancement = await enhanceFraudAnalysis(baseResult, ocrData);
  if (geminiEnhancement) {
    explanation = geminiEnhancement.explanation;
    recommendations = geminiEnhancement.recommendations.length > 0
      ? geminiEnhancement.recommendations
      : recommendations;
  }

  // Persist result
  await query(
    `INSERT INTO fraud_scores (invoice_id, risk_score, risk_level, fraud_indicators, anomaly_details, explanation, recommendations)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (invoice_id) DO UPDATE SET
       risk_score = EXCLUDED.risk_score, risk_level = EXCLUDED.risk_level,
       fraud_indicators = EXCLUDED.fraud_indicators, anomaly_details = EXCLUDED.anomaly_details,
       explanation = EXCLUDED.explanation, recommendations = EXCLUDED.recommendations,
       analyzed_at = NOW()`,
    [invoiceId, riskScore, riskLevel, JSON.stringify(indicators),
     JSON.stringify(anomalyDetails), explanation, JSON.stringify(recommendations)]
  );

  return {
    invoiceId, riskScore, riskLevel, fraudIndicators: indicators,
    anomalyDetails, explanation, recommendations, recommendation, confidence,
  };
}

async function getVendorHistory(vendorName: string): Promise<{ avgAmount: number; totalInvoices: number } | null> {
  if (!vendorName) return null;
  const result = await query<any>(
    `SELECT COUNT(*) AS total, AVG(total_amount) AS avg_amount
     FROM invoices WHERE LOWER(vendor_name) = LOWER($1) AND status = 'approved'`,
    [vendorName]
  );
  const row = result.rows[0];
  return { totalInvoices: parseInt(row.total, 10), avgAmount: parseFloat(row.avg_amount) || 0 };
}

async function getRecentInvoiceCount(vendorName: string, days: number): Promise<number> {
  if (!vendorName) return 0;
  const result = await query<any>(
    `SELECT COUNT(*) FROM invoices
     WHERE LOWER(vendor_name) = LOWER($1) AND created_at >= NOW() - INTERVAL '${days} days'`,
    [vendorName]
  );
  return parseInt(result.rows[0].count, 10);
}

function generateExplanation(
  score: number, level: string, indicators: string[], details: Record<string, any>
): string {
  if (indicators.length === 0) return 'No fraud indicators detected. Invoice appears legitimate.';
  const readable: Record<string, string> = {
    new_vendor:              'Vendor has fewer than 3 invoices on record',
    unusual_amount:          `Invoice amount is ${details.amountAnomaly?.multiplier || '3'}x above vendor average`,
    high_value_invoice:      'Invoice exceeds high-value threshold of $50,000',
    round_number_amount:     'Invoice amount is a suspicious round number',
    zero_tax_high_value:     'No tax declared on high-value invoice',
    tax_discrepancy:         `Tax amount deviates ${details.taxDiscrepancy?.variance || '?'} from expected`,
    missing_po_number:       'No purchase order number provided',
    due_date_before_invoice_date: 'Due date is before invoice date — impossible payment terms',
    same_day_payment_demand: 'Invoice demands same-day payment — unusual terms',
    frequency_anomaly:       `${details.frequencyAnomaly?.invoicesLast7Days || '?'} invoices submitted in last 7 days`,
    low_ocr_confidence:      `OCR confidence is only ${details.lowConfidence?.score || '?'}%`,
  };
  const parts = indicators.map((i) => readable[i] || i);
  return `Risk Score: ${score}/100 (${level.toUpperCase()}). Detected indicators: ${parts.join('; ')}.`;
}

function generateRecommendations(level: string, indicators: string[]): string[] {
  const recs: string[] = [];
  if (level === 'critical') {
    recs.push('Immediately freeze invoice for investigation');
    recs.push('Escalate to Finance Manager');
    recs.push('Contact vendor directly to verify authenticity');
  } else if (level === 'high') {
    recs.push('Route for manual review before approval');
    recs.push('Verify invoice details with vendor');
    recs.push('Check against PO system');
  } else if (level === 'medium') {
    recs.push('Secondary review recommended');
    recs.push('Verify tax registration and vendor details');
  } else {
    recs.push('Invoice can proceed through standard approval workflow');
  }
  if (indicators.includes('missing_po_number')) recs.push('Request PO number from vendor');
  if (indicators.includes('unusual_amount'))    recs.push('Verify scope of work justifies invoice amount');
  if (indicators.includes('new_vendor'))        recs.push('Complete vendor onboarding verification');
  return recs;
}

export async function getFraudScore(invoiceId: string): Promise<any> {
  const result = await query<any>(`SELECT * FROM fraud_scores WHERE invoice_id = $1 ORDER BY analyzed_at DESC LIMIT 1`, [invoiceId]);
  return result.rows[0] || null;
}

export async function getFraudTrends(): Promise<any> {
  const result = await query<any>(`
    SELECT
      DATE_TRUNC('month', analyzed_at) AS month,
      COUNT(*) AS total_analyzed,
      COUNT(*) FILTER (WHERE risk_level = 'critical') AS critical_count,
      COUNT(*) FILTER (WHERE risk_level = 'high')     AS high_count,
      COUNT(*) FILTER (WHERE risk_level = 'medium')   AS medium_count,
      COUNT(*) FILTER (WHERE risk_level = 'low')      AS low_count,
      AVG(risk_score) AS avg_risk_score
    FROM fraud_scores
    WHERE analyzed_at >= NOW() - INTERVAL '12 months'
    GROUP BY month ORDER BY month DESC
  `);
  return result.rows;
}

export async function getHighRiskVendors(): Promise<any> {
  const result = await query<any>(`
    SELECT
      i.vendor_name,
      COUNT(fs.id)          AS fraud_assessments,
      AVG(fs.risk_score)    AS avg_risk_score,
      MAX(fs.risk_score)    AS max_risk_score,
      COUNT(*) FILTER (WHERE fs.risk_level IN ('high','critical')) AS high_risk_count
    FROM fraud_scores fs
    JOIN invoices i ON fs.invoice_id = i.id
    WHERE i.vendor_name IS NOT NULL
    GROUP BY i.vendor_name
    HAVING AVG(fs.risk_score) > 40
    ORDER BY avg_risk_score DESC
    LIMIT 10
  `);
  return result.rows;
}
