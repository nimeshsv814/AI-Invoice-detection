import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, type, title, message, channel, priority, actionUrl, referenceId, referenceType, metadata } = req.body;
    if (!userId || !type || !title || !message) {
      throw new AppError('userId, type, title, and message are required', 400);
    }
    const notification = await notificationService.createNotification({
      userId, type, title, message, channel, priority, actionUrl, referenceId, referenceType, metadata,
    });
    sendSuccess(res, notification, 'Notification created');
  } catch (err) {
    next(err);
  }
}

export async function getMyNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { page, limit, isRead, type } = req.query as any;
    const result = await notificationService.getNotifications(req.user.userId, { page: +page || 1, limit: +limit || 20, isRead, type });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const updated = await notificationService.markRead(req.params.id, req.user.userId);
    if (!updated) throw new AppError('Notification not found', 404);
    sendSuccess(res, updated, 'Marked as read');
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const result = await notificationService.markAllRead(req.user.userId);
    sendSuccess(res, result, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
}
