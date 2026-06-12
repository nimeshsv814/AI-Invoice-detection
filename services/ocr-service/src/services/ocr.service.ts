import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface OcrExtractedData {
  invoiceNumber?: string;
  vendorName?: string;
  vendorAddress?: string;
  invoiceDate?: string;
  dueDate?: string;
  poNumber?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  currency?: string;
  lineItems?: LineItem[];
  confidence: number;
  fieldConfidences: Record<string, number>;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  productCode?: string;
  category?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI OCR Engine — Simulated intelligent data extraction
// In production: replace with Azure AI Document Intelligence / AWS Textract
// ─────────────────────────────────────────────────────────────────────────────
export async function extractInvoiceData(
  invoiceId: string,
  filePath: string
): Promise<OcrExtractedData> {
  const startTime = Date.now();

  // Simulated AI extraction with realistic variance
  const extracted = simulateOcrExtraction(filePath);

  const processingTime = Date.now() - startTime + Math.floor(Math.random() * 2000 + 500);

  // Persist OCR result
  await query(
    `INSERT INTO ocr_results (invoice_id, extracted_data, confidence_score, field_confidences, processing_time_ms, engine_version, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'success')
     ON CONFLICT (invoice_id) DO UPDATE SET
       extracted_data = EXCLUDED.extracted_data,
       confidence_score = EXCLUDED.confidence_score,
       field_confidences = EXCLUDED.field_confidences,
       processing_time_ms = EXCLUDED.processing_time_ms`,
    [
      invoiceId,
      JSON.stringify(extracted),
      extracted.confidence,
      JSON.stringify(extracted.fieldConfidences),
      processingTime,
      'ai-ocr-v1.0',
    ]
  );

  return extracted;
}

function simulateOcrExtraction(filePath: string): OcrExtractedData {
  // Generate deterministic-ish but realistic data based on file path seed
  const seed = filePath.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand  = (min: number, max: number) => min + (seed % (max - min));

  const vendors = [
    'Acme Technologies Inc.', 'Global Office Supplies Co.',
    'Premium Consulting Group', 'FastLogistics Partners', 'CloudSoft Solutions',
  ];
  const currencies = ['USD', 'EUR', 'GBP'];
  const invNum  = `INV-${2024}-${String(rand(100, 999)).padStart(4, '0')}`;
  const vendor  = vendors[seed % vendors.length];
  const amount  = parseFloat((rand(1000, 75000) + Math.random() * 1000).toFixed(2));
  const taxRate = 0.1;
  const tax     = parseFloat((amount * taxRate).toFixed(2));
  const total   = parseFloat((amount + tax).toFixed(2));

  const today    = new Date();
  const invDate  = new Date(today);
  invDate.setDate(today.getDate() - rand(1, 30));
  const dueDate  = new Date(invDate);
  dueDate.setDate(invDate.getDate() + 30);

  const lineItems: LineItem[] = [
    {
      description: 'Professional Services - Consulting',
      quantity:    rand(1, 5),
      unitPrice:   parseFloat((rand(500, 5000)).toFixed(2)),
      amount:      parseFloat((rand(500, 25000)).toFixed(2)),
      taxRate,
      taxAmount:   parseFloat((rand(50, 2500)).toFixed(2)),
      productCode: `SVC-${rand(100, 999)}`,
      category:    'Services',
    },
    {
      description: 'Software License - Annual',
      quantity:    1,
      unitPrice:   parseFloat((rand(1000, 20000)).toFixed(2)),
      amount:      parseFloat((rand(1000, 20000)).toFixed(2)),
      taxRate,
      taxAmount:   parseFloat((rand(100, 2000)).toFixed(2)),
      productCode: `LIC-${rand(100, 999)}`,
      category:    'Software',
    },
  ];

  const confidence = parseFloat((85 + Math.random() * 14).toFixed(1));

  return {
    invoiceNumber: invNum,
    vendorName:    vendor,
    vendorAddress: `${rand(100, 999)} Business Ave, Suite ${rand(100, 999)}, New York, NY 10001`,
    invoiceDate:   invDate.toISOString().split('T')[0],
    dueDate:       dueDate.toISOString().split('T')[0],
    poNumber:      `PO-${2024}-${String(rand(1, 999)).padStart(3, '0')}`,
    subtotal:      amount,
    taxAmount:     tax,
    totalAmount:   total,
    currency:      currencies[seed % currencies.length],
    lineItems,
    confidence,
    fieldConfidences: {
      invoiceNumber: parseFloat((90 + Math.random() * 9).toFixed(1)),
      vendorName:    parseFloat((88 + Math.random() * 11).toFixed(1)),
      vendorAddress: parseFloat((82 + Math.random() * 15).toFixed(1)),
      invoiceDate:   parseFloat((95 + Math.random() * 4).toFixed(1)),
      dueDate:       parseFloat((90 + Math.random() * 9).toFixed(1)),
      poNumber:      parseFloat((85 + Math.random() * 13).toFixed(1)),
      totalAmount:   parseFloat((97 + Math.random() * 2).toFixed(1)),
      taxAmount:     parseFloat((94 + Math.random() * 5).toFixed(1)),
      currency:      parseFloat((99 + Math.random() * 0.9).toFixed(1)),
    },
  };
}

export async function getOcrResult(invoiceId: string): Promise<any> {
  const result = await query<any>(
    `SELECT * FROM ocr_results WHERE invoice_id = $1 ORDER BY processed_at DESC LIMIT 1`,
    [invoiceId]
  );
  return result.rows[0] || null;
}
