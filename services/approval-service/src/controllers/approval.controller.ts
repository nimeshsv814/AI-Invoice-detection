import { Request, Response, NextFunction } from 'express';
import * as approvalService from '../services/approval.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export async function startWorkflow(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId, aiRecommendation, aiConfidence, aiExplanation, priority } = req.body;
    if (!invoiceId) {
      throw new AppError('invoiceId is required', 400);
    }
    const result = await approvalService.startWorkflow({
      invoiceId,
      aiRecommendation,
      aiConfidence,
      aiExplanation,
      priority,
    });
    sendSuccess(res, result, 'Workflow started');
  } catch (err) {
    next(err);
  }
}

export async function getWorkflow(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId } = req.params;
    const result = await approvalService.getWorkflow(invoiceId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function performAction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { invoiceId, action, comments, escalatedTo } = req.body;
    if (!invoiceId || !action) {
      throw new AppError('invoiceId and action are required', 400);
    }

    const userId = req.user?.userId;
    const userName = req.user ? `${req.user.email}` : 'System/API'; // or query DB for full name

    const result = await approvalService.recordAction({
      invoiceId,
      action,
      performedBy: userId,
      performerName: userName,
      comments,
      escalatedTo,
    });
    sendSuccess(res, result, `Workflow action [${action}] recorded`);
  } catch (err) {
    next(err);
  }
}

export async function getQueue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const assignedTo = req.query.assignedTo as string || req.user?.userId; // default to current user if filter not set

    const queue = await approvalService.getQueue({
      assignedTo,
      status,
      priority,
    });
    sendSuccess(res, queue);
  } catch (err) {
    next(err);
  }
}
