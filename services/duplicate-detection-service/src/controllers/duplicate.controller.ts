import { Request, Response, NextFunction } from 'express';
import * as duplicateService from '../services/duplicate.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../middleware/error.middleware';

export async function checkInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId, invoiceNumber, vendorName, totalAmount, invoiceDate, poNumber } = req.body;
    if (!invoiceId) {
      throw new AppError('invoiceId is required', 400);
    }
    const result = await duplicateService.checkForDuplicates({
      invoiceId,
      invoiceNumber,
      vendorName,
      totalAmount,
      invoiceDate,
      poNumber,
    });
    sendSuccess(res, result, 'Duplicate check completed');
  } catch (err) {
    next(err);
  }
}

export async function getAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const alerts = await duplicateService.getDuplicateAlerts();
    sendSuccess(res, alerts);
  } catch (err) {
    next(err);
  }
}

export async function resolveAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, resolvedBy, notes } = req.body;
    if (!status || !resolvedBy) {
      throw new AppError('status and resolvedBy are required', 400);
    }
    if (status !== 'confirmed_duplicate' && status !== 'false_positive') {
      throw new AppError('Invalid resolution status', 400);
    }
    await duplicateService.resolveDuplicate(id, status, resolvedBy, notes);
    sendSuccess(res, null, 'Duplicate alert resolved successfully');
  } catch (err) {
    next(err);
  }
}
