import axios from 'axios';
import * as approvalRepo from '../repositories/approval.repository';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

const INVOICE_SERVICE_URL = process.env.INVOICE_SERVICE_URL || 'http://invoice-service:3002';

export async function startWorkflow(workflowInfo: {
  invoiceId: string;
  aiRecommendation?: string;
  aiConfidence?: number;
  aiExplanation?: string;
  priority?: string;
}): Promise<any> {
  // Check if workflow already exists
  const existing = await approvalRepo.findWorkflowByInvoiceId(workflowInfo.invoiceId);
  if (existing) return existing;

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

export async function getWorkflow(invoiceId: string): Promise<any> {
  const workflow = await approvalRepo.findWorkflowByInvoiceId(invoiceId);
  if (!workflow) {
    throw new AppError('Approval workflow not found for this invoice', 404);
  }
  return workflow;
}

export async function recordAction(actionInfo: {
  invoiceId: string;
  action: 'approved' | 'rejected' | 'commented' | 'escalated' | 'on_hold';
  performedBy?: string;
  performerName?: string;
  comments?: string;
  escalatedTo?: string;
}): Promise<any> {
  const workflow = await approvalRepo.findWorkflowByInvoiceId(actionInfo.invoiceId);
  if (!workflow) {
    throw new AppError('Workflow not found', 404);
  }

  let newStatus = workflow.status;
  let newStep = workflow.current_step;

  if (actionInfo.action === 'approved') {
    newStatus = 'approved';
    newStep = 'completed';
  } else if (actionInfo.action === 'rejected') {
    newStatus = 'rejected';
    newStep = 'completed';
  } else if (actionInfo.action === 'on_hold') {
    newStatus = 'on_hold';
    newStep = 'manager_review';
  } else if (actionInfo.action === 'escalated') {
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
      await axios.patch(`${INVOICE_SERVICE_URL}/api/invoices/${workflow.invoice_id}/status`, {
        status: actionInfo.action === 'approved' ? 'approved' : 'rejected',
        comments: actionInfo.comments,
      });
      logger.info(`Synced status update for invoice ${workflow.invoice_id} to invoice-service`);
    } catch (err: any) {
      logger.error(`Failed to update status in invoice-service: ${err.message}`);
    }
  }

  return approvalRepo.findWorkflowByInvoiceId(workflow.invoice_id);
}

export async function getQueue(filters: {
  assignedTo?: string;
  status?: string;
  priority?: string;
}) {
  return approvalRepo.findApprovalQueue(filters);
}
