"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadInvoice = uploadInvoice;
exports.getInvoices = getInvoices;
exports.getInvoiceById = getInvoiceById;
exports.getDashboardStats = getDashboardStats;
exports.updateInvoiceStatus = updateInvoiceStatus;
const axios_1 = __importDefault(require("axios"));
const invoiceRepo = __importStar(require("../repositories/invoice.repository"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://ocr-service:3003';
const DUPLICATE_SERVICE_URL = process.env.DUPLICATE_SERVICE_URL || 'http://duplicate-detection-service:3004';
const FRAUD_SERVICE_URL = process.env.FRAUD_SERVICE_URL || 'http://fraud-detection-service:3005';
const APPROVAL_SERVICE_URL = process.env.APPROVAL_SERVICE_URL || 'http://approval-service:3006';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3008';
async function uploadInvoice(file, userId, userEmail) {
    // 1. Persist initial uploaded invoice metadata
    const invoice = await invoiceRepo.createInvoice({
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        fileType: file.mimetype,
        status: 'uploaded',
        uploadedBy: userId,
    });
    // 2. Trigger asynchronous background processing pipeline
    // In production, this would be pushed to a message queue like RabbitMQ or Bull/Redis
    // We will run it in the background of the Node process to provide instant API response
    processInvoicePipeline(invoice.id, file.path, userId, userEmail).catch((err) => {
        logger_1.default.error(`Pipeline failure for invoice ${invoice.id}:`, err);
    });
    return invoice;
}
async function getInvoices(filters) {
    return invoiceRepo.findInvoices(filters);
}
async function getInvoiceById(id) {
    const invoice = await invoiceRepo.findInvoiceById(id);
    if (!invoice)
        throw new error_middleware_1.AppError('Invoice not found', 404);
    return invoice;
}
async function getDashboardStats() {
    return invoiceRepo.getDashboardStats();
}
async function updateInvoiceStatus(id, status, comments) {
    const invoice = await getInvoiceById(id);
    if (!invoice)
        throw new error_middleware_1.AppError('Invoice not found', 404);
    const updatedInvoice = await invoiceRepo.updateInvoice(id, { status });
    // Call approval service to record history/action if status is manual approval/rejection
    try {
        if (status === 'approved' || status === 'rejected') {
            await axios_1.default.post(`${APPROVAL_SERVICE_URL}/api/approval/action`, {
                invoiceId: id,
                action: status === 'approved' ? 'approved' : 'rejected',
                comments: comments || 'Updated manually via Invoice Service',
            });
        }
    }
    catch (err) {
        logger_1.default.warn(`Failed to sync status update with approval service for invoice ${id}: ${err.message}`);
    }
    return updatedInvoice;
}
/**
 * Intelligent Invoice Processing Pipeline (Event-driven / Async Chain)
 * OCR -> Duplicate Check -> Fraud Check -> Workflow Routing -> Notifications
 */
async function processInvoicePipeline(invoiceId, filePath, userId, userEmail) {
    logger_1.default.info(`Starting processing pipeline for invoice ${invoiceId}`);
    // ── Step 1: OCR Extraction ──
    await invoiceRepo.updateInvoice(invoiceId, { status: 'processing' });
    let ocrData;
    try {
        const ocrResponse = await axios_1.default.post(`${OCR_SERVICE_URL}/api/ocr/process`, {
            invoiceId,
            filePath,
        });
        ocrData = ocrResponse.data.data;
        logger_1.default.info(`OCR processing complete for invoice ${invoiceId}`);
    }
    catch (err) {
        logger_1.default.error(`OCR service error for invoice ${invoiceId}: ${err.message}`);
        await invoiceRepo.updateInvoice(invoiceId, { status: 'on_hold', aiExplanation: 'OCR extraction failed' });
        return;
    }
    // Check if vendor exists or if we should assign a vendor
    // In production, we lookup by vendor name/code. For now, let's find or assign a sample vendor
    let vendorId = null;
    try {
        const vendorsResult = await invoiceRepo.query(`SELECT id FROM vendors WHERE LOWER(company_name) = LOWER($1) LIMIT 1`, [ocrData.vendorName]);
        if (vendorsResult.rowCount > 0) {
            vendorId = vendorsResult.rows[0].id;
        }
        else {
            // Assign VND-001 (Acme) as fallback vendor for simulation
            const fallbackVendor = await invoiceRepo.query(`SELECT id FROM vendors LIMIT 1`);
            if (fallbackVendor.rowCount > 0)
                vendorId = fallbackVendor.rows[0].id;
        }
    }
    catch (err) {
        logger_1.default.error('Failed to query vendor for invoice:', err);
    }
    // Update invoice with extracted OCR details
    await invoiceRepo.updateInvoice(invoiceId, {
        status: 'ocr_complete',
        invoiceNumber: ocrData.invoiceNumber,
        vendorId,
        vendorName: ocrData.vendorName,
        vendorAddress: ocrData.vendorAddress,
        invoiceDate: ocrData.invoiceDate ? new Date(ocrData.invoiceDate) : null,
        dueDate: ocrData.dueDate ? new Date(ocrData.dueDate) : null,
        poNumber: ocrData.poNumber,
        subtotal: ocrData.subtotal,
        taxAmount: ocrData.taxAmount,
        totalAmount: ocrData.totalAmount,
        currency: ocrData.currency,
        ocrConfidence: ocrData.confidence,
        ocrData,
    });
    // Save line items
    if (ocrData.lineItems && Array.isArray(ocrData.lineItems)) {
        await invoiceRepo.saveLineItems(invoiceId, ocrData.lineItems);
    }
    // ── Step 2: Duplicate Check ──
    await invoiceRepo.updateInvoice(invoiceId, { status: 'duplicate_check' });
    let duplicateResult = { isDuplicate: false, riskScore: 0 };
    try {
        const dupResponse = await axios_1.default.post(`${DUPLICATE_SERVICE_URL}/api/duplicate/check`, {
            invoiceId,
            invoiceNumber: ocrData.invoiceNumber,
            vendorName: ocrData.vendorName,
            totalAmount: ocrData.totalAmount,
            invoiceDate: ocrData.invoiceDate,
            poNumber: ocrData.poNumber,
        });
        duplicateResult = dupResponse.data.data;
        logger_1.default.info(`Duplicate check complete for invoice ${invoiceId}: duplicate=${duplicateResult.isDuplicate}`);
    }
    catch (err) {
        logger_1.default.warn(`Duplicate service error for invoice ${invoiceId}: ${err.message}`);
    }
    await invoiceRepo.updateInvoice(invoiceId, {
        isDuplicate: duplicateResult.isDuplicate,
        duplicateRiskScore: duplicateResult.riskScore,
    });
    if (duplicateResult.isDuplicate) {
        await invoiceRepo.updateInvoice(invoiceId, {
            status: 'pending_review',
            aiExplanation: 'Duplicate invoice detected with high confidence.',
        });
        // Trigger notification
        await sendNotification(userId, 'duplicate_detected', 'Duplicate Invoice Alert', `Invoice ${ocrData.invoiceNumber || 'unknown'} has been flagged as a duplicate.`);
        return;
    }
    // ── Step 3: Fraud Check ──
    await invoiceRepo.updateInvoice(invoiceId, { status: 'fraud_check' });
    let fraudResult = { riskScore: 0, riskLevel: 'low', recommendation: 'approve', explanation: 'No anomalies' };
    try {
        const fraudResponse = await axios_1.default.post(`${FRAUD_SERVICE_URL}/api/fraud/analyze`, {
            invoiceId,
            ocrData,
        });
        fraudResult = fraudResponse.data.data;
        logger_1.default.info(`Fraud analysis complete for invoice ${invoiceId}: score=${fraudResult.riskScore}`);
    }
    catch (err) {
        logger_1.default.warn(`Fraud service error for invoice ${invoiceId}: ${err.message}`);
    }
    const isFraudSuspected = fraudResult.riskLevel === 'critical' || fraudResult.riskLevel === 'high';
    await invoiceRepo.updateInvoice(invoiceId, {
        fraudRiskScore: fraudResult.riskScore,
        fraudRiskLevel: fraudResult.riskLevel,
        isFraudSuspected,
        aiRecommendation: fraudResult.recommendation,
        aiExplanation: fraudResult.explanation,
    });
    // ── Step 4: Approval Workflow Start ──
    let approvalWorkflow;
    try {
        const appResponse = await axios_1.default.post(`${APPROVAL_SERVICE_URL}/api/approval/start`, {
            invoiceId,
            aiRecommendation: fraudResult.recommendation,
            aiConfidence: fraudResult.confidence || 90.0,
            aiExplanation: fraudResult.explanation,
            priority: isFraudSuspected ? 'urgent' : fraudResult.riskScore > 30 ? 'high' : 'normal',
        });
        approvalWorkflow = appResponse.data.data;
        logger_1.default.info(`Approval workflow started for invoice ${invoiceId}`);
    }
    catch (err) {
        logger_1.default.warn(`Approval service error for invoice ${invoiceId}: ${err.message}`);
    }
    // ── Step 5: Final Status & Notification ──
    let finalStatus = 'pending_review';
    if (isFraudSuspected) {
        finalStatus = 'fraud_suspected';
        await sendNotification(userId, 'fraud_detected', 'CRITICAL: Fraud Risk Suspected', `Invoice ${ocrData.invoiceNumber || 'unknown'} has high fraud risk score of ${fraudResult.riskScore}%.`);
    }
    else if (fraudResult.recommendation === 'approve') {
        // If auto-approved by AI and not high risk, route to pending_review or approve
        // Usually enterprise platforms require a manual eyes-on check unless auto-match is enabled
        finalStatus = 'pending_review';
        await sendNotification(userId, 'approval_required', 'Invoice Ready for Review', `Invoice ${ocrData.invoiceNumber || 'unknown'} from ${ocrData.vendorName} is ready for approval.`);
    }
    await invoiceRepo.updateInvoice(invoiceId, {
        status: finalStatus,
        processingCompletedAt: new Date(),
    });
}
async function sendNotification(userId, type, title, message) {
    try {
        await axios_1.default.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
            userId,
            type,
            title,
            message,
            channel: 'both',
            priority: type === 'fraud_detected' ? 'urgent' : 'normal',
        });
    }
    catch (err) {
        logger_1.default.warn(`Failed to send notification via notification-service: ${err.message}`);
    }
}
//# sourceMappingURL=invoice.service.js.map