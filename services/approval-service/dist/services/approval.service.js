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
exports.startWorkflow = startWorkflow;
exports.getWorkflow = getWorkflow;
exports.recordAction = recordAction;
exports.getQueue = getQueue;
const axios_1 = __importDefault(require("axios"));
const approvalRepo = __importStar(require("../repositories/approval.repository"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const INVOICE_SERVICE_URL = process.env.INVOICE_SERVICE_URL || 'http://invoice-service:3002';
async function startWorkflow(workflowInfo) {
    // Check if workflow already exists
    const existing = await approvalRepo.findWorkflowByInvoiceId(workflowInfo.invoiceId);
    if (existing)
        return existing;
    // For simulation, assign workflows to the Finance Manager user by default (Michael Chen from seed)
    const defaultManagerId = '10000000-0000-0000-0000-000000000003';
    const workflow = await approvalRepo.createWorkflow({
        invoiceId: workflowInfo.invoiceId,
        currentStep: 'manager_review',
        status: 'pending_review',
        aiRecommendation: workflowInfo.aiRecommendation,
        aiConfidence: workflowInfo.aiConfidence,
        aiExplanation: workflowInfo.aiExplanation,
        assignedTo: defaultManagerId,
        priority: workflowInfo.priority || 'normal',
    });
    // Record history
    await approvalRepo.createHistoryEntry({
        workflowId: workflow.id,
        invoiceId: workflow.invoice_id,
        step: 'ocr_processing',
        action: 'submitted',
        performerName: 'System AI',
        comments: 'Invoice uploaded and OCR extraction completed.',
    });
    if (workflowInfo.aiRecommendation) {
        await approvalRepo.createHistoryEntry({
            workflowId: workflow.id,
            invoiceId: workflow.invoice_id,
            step: 'fraud_check',
            action: 'ai_recommended',
            performerName: 'AI Fraud Engine',
            comments: `AI recommendation: ${workflowInfo.aiRecommendation.toUpperCase()} (Confidence: ${workflowInfo.aiConfidence}%). Reason: ${workflowInfo.aiExplanation}`,
        });
    }
    await approvalRepo.createHistoryEntry({
        workflowId: workflow.id,
        invoiceId: workflow.invoice_id,
        step: 'manager_review',
        action: 'assigned',
        performedBy: defaultManagerId,
        performerName: 'Michael Chen',
        comments: 'Workflow assigned to Finance Manager for review.',
    });
    return approvalRepo.findWorkflowByInvoiceId(workflow.invoice_id);
}
async function getWorkflow(invoiceId) {
    const workflow = await approvalRepo.findWorkflowByInvoiceId(invoiceId);
    if (!workflow) {
        throw new error_middleware_1.AppError('Approval workflow not found for this invoice', 404);
    }
    return workflow;
}
async function recordAction(actionInfo) {
    const workflow = await approvalRepo.findWorkflowByInvoiceId(actionInfo.invoiceId);
    if (!workflow) {
        throw new error_middleware_1.AppError('Workflow not found', 404);
    }
    let newStatus = workflow.status;
    let newStep = workflow.current_step;
    if (actionInfo.action === 'approved') {
        newStatus = 'approved';
        newStep = 'completed';
    }
    else if (actionInfo.action === 'rejected') {
        newStatus = 'rejected';
        newStep = 'completed';
    }
    else if (actionInfo.action === 'escalated') {
        newStatus = 'pending_review';
        newStep = 'manager_review';
    }
    // Update workflow
    await approvalRepo.updateWorkflow(workflow.id, {
        status: newStatus,
        currentStep: newStep,
        assignedTo: actionInfo.action === 'escalated' ? actionInfo.escalatedTo : workflow.assigned_to,
        escalatedTo: actionInfo.action === 'escalated' ? actionInfo.escalatedTo : null,
        completedAt: (actionInfo.action === 'approved' || actionInfo.action === 'rejected') ? new Date() : null,
    });
    // Log history
    await approvalRepo.createHistoryEntry({
        workflowId: workflow.id,
        invoiceId: workflow.invoice_id,
        step: workflow.current_step,
        action: actionInfo.action,
        performedBy: actionInfo.performedBy,
        performerName: actionInfo.performerName || 'User',
        comments: actionInfo.comments || '',
    });
    // Call invoice-service to sync invoice status (only if approved or rejected)
    if (actionInfo.action === 'approved' || actionInfo.action === 'rejected') {
        try {
            await axios_1.default.patch(`${INVOICE_SERVICE_URL}/api/invoices/${workflow.invoice_id}/status`, {
                status: actionInfo.action === 'approved' ? 'approved' : 'rejected',
                comments: actionInfo.comments,
            });
            logger_1.default.info(`Synced status update for invoice ${workflow.invoice_id} to invoice-service`);
        }
        catch (err) {
            logger_1.default.error(`Failed to update status in invoice-service: ${err.message}`);
        }
    }
    return approvalRepo.findWorkflowByInvoiceId(workflow.invoice_id);
}
async function getQueue(filters) {
    return approvalRepo.findApprovalQueue(filters);
}
//# sourceMappingURL=approval.service.js.map