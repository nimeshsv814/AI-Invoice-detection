import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analytics.service';
import { sendSuccess } from '../utils/response';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getDashboardKPIs();
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function getSpendAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const period = (req.query.period as string) || '12months';
    const data = await analyticsService.getSpendAnalytics(period);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function getFraudAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getFraudAnalytics();
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { entityType, userId, action, page, limit } = req.query as any;
    const data = await analyticsService.getAuditLogs({ entityType, userId, action, page: +page || 1, limit: +limit || 50 });
    sendSuccess(res, data);
  } catch (err) { next(err); }
}
