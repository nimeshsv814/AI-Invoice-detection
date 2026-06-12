import { Request, Response, NextFunction } from 'express';
export declare function checkInvoice(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getAlerts(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function resolveAlert(req: Request, res: Response, next: NextFunction): Promise<void>;
