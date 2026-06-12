import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare function uploadInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getInvoices(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
