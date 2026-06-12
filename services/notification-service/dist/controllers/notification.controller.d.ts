import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare function createNotification(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getMyNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function markRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function markAllRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
