import { Request, Response, NextFunction } from 'express';
import * as ocrService from '../services/ocr.service';
import { sendSuccess, sendError } from '../utils/response';

// POST /api/ocr/process
export async function processInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId, filePath } = req.body;
    if (!invoiceId || !filePath) { sendError(res, 'invoiceId and filePath required', 400); return; }
    const extracted = await ocrService.extractInvoiceData(invoiceId, filePath);
    sendSuccess(res, extracted, 'OCR processing complete');
  } catch (err) { next(err); }
}

// GET /api/ocr/result/:invoiceId
export async function getResult(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ocrService.getOcrResult(req.params.invoiceId);
    if (!result) { sendError(res, 'OCR result not found', 404); return; }
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
