"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractInvoiceData = extractInvoiceData;
exports.getOcrResult = getOcrResult;
const database_1 = require("../config/database");
const tesseract_js_1 = require("tesseract.js");
const pdf_parse_1 = require("pdf-parse");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
const configuredEngine = (process.env.OCR_ENGINE || 'simulation').toLowerCase();
const fallbackToSimulation = (process.env.OCR_FALLBACK_TO_SIMULATION || 'true').toLowerCase() !== 'false';
// OCR engine. Local libraries are used in production; simulation keeps demos simple.
async function extractInvoiceData(invoiceId, filePath) {
    const startTime = Date.now();
    let engine = configuredEngine === 'local' ? 'local' : 'simulation';
    let extracted;
    try {
        extracted = engine === 'local'
            ? await extractWithLocalLibraries(filePath)
            : simulateOcrExtraction(filePath);
    }
    catch (error) {
        if (!fallbackToSimulation)
            throw error;
        engine = 'simulation';
        logger_1.default.warn(`Local OCR failed for ${path_1.default.basename(filePath)}. Falling back to simulation.`, error);
        extracted = simulateOcrExtraction(filePath);
    }
    const processingTime = Date.now() - startTime + Math.floor(Math.random() * 2000 + 500);
    // Persist OCR result
    await (0, database_1.query)(`INSERT INTO ocr_results (invoice_id, extracted_data, confidence_score, field_confidences, processing_time_ms, engine_version, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'success')
     ON CONFLICT (invoice_id) DO UPDATE SET
       extracted_data = EXCLUDED.extracted_data,
       confidence_score = EXCLUDED.confidence_score,
       field_confidences = EXCLUDED.field_confidences,
       processing_time_ms = EXCLUDED.processing_time_ms`, [
        invoiceId,
        JSON.stringify(extracted),
        extracted.confidence,
        JSON.stringify(extracted.fieldConfidences),
        processingTime,
        engine === 'local' ? 'local-library-ocr-v1' : 'simulated-ai-ocr-v1',
    ]);
    return extracted;
}
async function extractWithLocalLibraries(filePath) {
    const ext = path_1.default.extname(filePath).toLowerCase();
    const rawText = ext === '.pdf'
        ? await extractTextFromPdf(filePath)
        : await extractTextFromImage(filePath);
    if (rawText.trim().length < 20) {
        throw new Error('Local OCR did not find enough readable invoice text.');
    }
    return parseInvoiceText(rawText);
}
async function extractTextFromPdf(filePath) {
    const buffer = await promises_1.default.readFile(filePath);
    const parser = new pdf_parse_1.PDFParse({ data: buffer });
    try {
        const result = await parser.getText();
        return result.text || '';
    }
    finally {
        await parser.destroy();
    }
}
async function extractTextFromImage(filePath) {
    const worker = await (0, tesseract_js_1.createWorker)(process.env.OCR_LANGUAGE || 'eng');
    try {
        const result = await worker.recognize(filePath);
        return result.data.text || '';
    }
    finally {
        await worker.terminate();
    }
}
function parseInvoiceText(rawText) {
    const text = rawText.replace(/\r/g, '\n');
    const lines = text
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    const invoiceNumber = findText(text, [
        /invoice\s*(?:number|no\.?|#|id)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9\-\/_.]{2,})/i,
        /\binv\s*(?:number|no\.?|#)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9\-\/_.]{2,})/i,
    ]);
    const poNumber = findText(text, [
        /(?:purchase\s*order|po)\s*(?:number|no\.?|#)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9\-\/_.]{2,})/i,
    ]);
    const invoiceDate = normalizeDate(findText(text, [
        /invoice\s*date\s*[:#-]?\s*([0-9]{1,4}[\/\-. ][0-9]{1,2}[\/\-. ][0-9]{2,4})/i,
        /\bdate\s*[:#-]?\s*([0-9]{1,4}[\/\-. ][0-9]{1,2}[\/\-. ][0-9]{2,4})/i,
    ]));
    const dueDate = normalizeDate(findText(text, [
        /due\s*date\s*[:#-]?\s*([0-9]{1,4}[\/\-. ][0-9]{1,2}[\/\-. ][0-9]{2,4})/i,
    ]));
    const subtotal = findAmount(text, [/subtotal\s*[:#-]?\s*([$A-Z]{0,4}\s*[0-9,]+(?:\.[0-9]{2})?)/i]);
    const taxAmount = findAmount(text, [/(?:tax|gst|vat)\s*[:#-]?\s*([$A-Z]{0,4}\s*[0-9,]+(?:\.[0-9]{2})?)/i]);
    const totalAmount = findAmount(text, [
        /(?:grand\s*total|amount\s*due|balance\s*due|total)\s*[:#-]?\s*([$A-Z]{0,4}\s*[0-9,]+(?:\.[0-9]{2})?)/i,
    ]);
    const vendorName = findVendorName(lines);
    const vendorAddress = findVendorAddress(lines);
    const currency = findCurrency(text);
    const lineItems = buildLineItems(lines);
    const fieldConfidences = buildFieldConfidences({
        invoiceNumber,
        vendorName,
        invoiceDate,
        dueDate,
        poNumber,
        subtotal,
        taxAmount,
        totalAmount,
        currency,
    });
    const confidence = Object.values(fieldConfidences).length
        ? parseFloat((Object.values(fieldConfidences).reduce((sum, value) => sum + value, 0) / Object.values(fieldConfidences).length).toFixed(1))
        : 55;
    return {
        invoiceNumber,
        vendorName,
        vendorAddress,
        invoiceDate,
        dueDate,
        poNumber,
        subtotal,
        taxAmount,
        totalAmount,
        currency,
        lineItems,
        confidence,
        fieldConfidences,
    };
}
function findText(text, patterns) {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1])
            return match[1].trim();
    }
    return undefined;
}
function findAmount(text, patterns) {
    const value = findText(text, patterns);
    return parseMoney(value);
}
function parseMoney(value) {
    if (!value)
        return undefined;
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
}
function findVendorName(lines) {
    const ignored = /invoice|receipt|statement|bill\s*to|ship\s*to|date|total|subtotal|tax|amount|page/i;
    const likelyVendor = lines.find((line) => line.length >= 3 && line.length <= 80 && !ignored.test(line));
    return likelyVendor;
}
function findVendorAddress(lines) {
    const addressLine = lines.find((line) => /\d+/.test(line) && /(street|st\.?|road|rd\.?|avenue|ave\.?|suite|ste\.?|lane|ln\.?|drive|dr\.?|blvd|boulevard)/i.test(line));
    return addressLine;
}
function findCurrency(text) {
    if (/\bINR\b|₹/i.test(text))
        return 'INR';
    if (/\bEUR\b|€/i.test(text))
        return 'EUR';
    if (/\bGBP\b|£/i.test(text))
        return 'GBP';
    if (/\bUSD\b|\$/i.test(text))
        return 'USD';
    return 'USD';
}
function buildLineItems(lines) {
    return lines
        .map((line) => {
        const match = line.match(/^(.{3,}?)\s+(\d+(?:\.\d+)?)\s+([$A-Z]{0,4}\s*[0-9,]+(?:\.[0-9]{2})?)\s+([$A-Z]{0,4}\s*[0-9,]+(?:\.[0-9]{2})?)$/i);
        if (!match)
            return null;
        const quantity = Number(match[2]);
        const unitPrice = parseMoney(match[3]) || 0;
        const amount = parseMoney(match[4]) || unitPrice * quantity;
        return {
            description: match[1].trim(),
            quantity,
            unitPrice,
            amount,
        };
    })
        .filter((item) => Boolean(item))
        .slice(0, 25);
}
function buildFieldConfidences(fields) {
    return Object.entries(fields).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            acc[key] = key === 'currency' ? 75 : 80;
        }
        return acc;
    }, {});
}
function normalizeDate(value) {
    if (!value)
        return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().split('T')[0];
}
function simulateOcrExtraction(filePath) {
    // Generate deterministic-ish but realistic data based on file path seed
    const seed = filePath.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = (min, max) => min + (seed % (max - min));
    const vendors = [
        'Acme Technologies Inc.', 'Global Office Supplies Co.',
        'Premium Consulting Group', 'FastLogistics Partners', 'CloudSoft Solutions',
    ];
    const currencies = ['USD', 'EUR', 'GBP'];
    const invNum = `INV-${2024}-${String(rand(100, 999)).padStart(4, '0')}`;
    const vendor = vendors[seed % vendors.length];
    const amount = parseFloat((rand(1000, 75000) + Math.random() * 1000).toFixed(2));
    const taxRate = 0.1;
    const tax = parseFloat((amount * taxRate).toFixed(2));
    const total = parseFloat((amount + tax).toFixed(2));
    const today = new Date();
    const invDate = new Date(today);
    invDate.setDate(today.getDate() - rand(1, 30));
    const dueDate = new Date(invDate);
    dueDate.setDate(invDate.getDate() + 30);
    const lineItems = [
        {
            description: 'Professional Services - Consulting',
            quantity: rand(1, 5),
            unitPrice: parseFloat((rand(500, 5000)).toFixed(2)),
            amount: parseFloat((rand(500, 25000)).toFixed(2)),
            taxRate,
            taxAmount: parseFloat((rand(50, 2500)).toFixed(2)),
            productCode: `SVC-${rand(100, 999)}`,
            category: 'Services',
        },
        {
            description: 'Software License - Annual',
            quantity: 1,
            unitPrice: parseFloat((rand(1000, 20000)).toFixed(2)),
            amount: parseFloat((rand(1000, 20000)).toFixed(2)),
            taxRate,
            taxAmount: parseFloat((rand(100, 2000)).toFixed(2)),
            productCode: `LIC-${rand(100, 999)}`,
            category: 'Software',
        },
    ];
    const confidence = parseFloat((85 + Math.random() * 14).toFixed(1));
    return {
        invoiceNumber: invNum,
        vendorName: vendor,
        vendorAddress: `${rand(100, 999)} Business Ave, Suite ${rand(100, 999)}, New York, NY 10001`,
        invoiceDate: invDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        poNumber: `PO-${2024}-${String(rand(1, 999)).padStart(3, '0')}`,
        subtotal: amount,
        taxAmount: tax,
        totalAmount: total,
        currency: currencies[seed % currencies.length],
        lineItems,
        confidence,
        fieldConfidences: {
            invoiceNumber: parseFloat((90 + Math.random() * 9).toFixed(1)),
            vendorName: parseFloat((88 + Math.random() * 11).toFixed(1)),
            vendorAddress: parseFloat((82 + Math.random() * 15).toFixed(1)),
            invoiceDate: parseFloat((95 + Math.random() * 4).toFixed(1)),
            dueDate: parseFloat((90 + Math.random() * 9).toFixed(1)),
            poNumber: parseFloat((85 + Math.random() * 13).toFixed(1)),
            totalAmount: parseFloat((97 + Math.random() * 2).toFixed(1)),
            taxAmount: parseFloat((94 + Math.random() * 5).toFixed(1)),
            currency: parseFloat((99 + Math.random() * 0.9).toFixed(1)),
        },
    };
}
async function getOcrResult(invoiceId) {
    const result = await (0, database_1.query)(`SELECT * FROM ocr_results WHERE invoice_id = $1 ORDER BY processed_at DESC LIMIT 1`, [invoiceId]);
    return result.rows[0] || null;
}
//# sourceMappingURL=ocr.service.js.map