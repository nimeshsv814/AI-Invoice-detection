import { Request, Response, NextFunction } from 'express';
import * as fraudService from '../services/fraud.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/error.middleware';

export async function analyzeInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId, ocrData } = req.body;
    if (!invoiceId || !ocrData) {
      throw new AppError('invoiceId and ocrData are required', 400);
    }
    const result = await fraudService.analyzeInvoice(invoiceId, ocrData);
    sendSuccess(res, result, 'Fraud analysis completed');
  } catch (err) {
    next(err);
  }
}

export async function getScore(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId } = req.params;
    const result = await fraudService.getFraudScore(invoiceId);
    if (!result) {
      throw new AppError('Fraud score not found for this invoice', 404);
    }
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const trends = await fraudService.getFraudTrends();
    sendSuccess(res, trends);
  } catch (err) {
    next(err);
  }
}

export async function getHighRiskVendors(req: Request, res: Response, next: NextFunction) {
  try {
    const vendors = await fraudService.getHighRiskVendors();
    sendSuccess(res, vendors);
  } catch (err) {
    next(err);
  }
}
