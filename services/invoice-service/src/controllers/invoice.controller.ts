import { Request, Response, NextFunction } from 'express';
import * as invoiceService from '../services/invoice.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '../utils/response';

export async function uploadInvoice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) { sendError(res, 'No file uploaded', 400); return; }
    const invoice = await invoiceService.uploadInvoice(req.file, req.user!.userId, req.user!.email);
    sendCreated(res, invoice, 'Invoice uploaded successfully. Processing started.');
  } catch (err) { next(err); }
}

export async function getInvoices(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page  = parseInt(req.query.page  as string || '1',  10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const { invoices, total } = await invoiceService.getInvoices({
      page, limit,
      status:     req.query.status     as string,
      vendorId:   req.query.vendorId   as string,
      search:     req.query.search     as string,
      startDate:  req.query.startDate  as string,
      endDate:    req.query.endDate    as string,
      minAmount:  req.query.minAmount  ? parseFloat(req.query.minAmount  as string) : undefined,
      maxAmount:  req.query.maxAmount  ? parseFloat(req.query.maxAmount  as string) : undefined,
      uploadedBy: req.user?.role !== 'admin' && req.user?.role !== 'finance_manager'
                  ? req.user?.userId : req.query.uploadedBy as string,
    });
    sendPaginated(res, invoices, total, page, limit);
  } catch (err) { next(err); }
}

export async function getInvoice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    sendSuccess(res, invoice);
  } catch (err) { next(err); }
}

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await invoiceService.getDashboardStats();
    sendSuccess(res, stats);
  } catch (err) { next(err); }
}

export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.updateInvoiceStatus(
      req.params.id, req.body.status, req.body.comments
    );
    sendSuccess(res, invoice, 'Status updated');
  } catch (err) { next(err); }
}
