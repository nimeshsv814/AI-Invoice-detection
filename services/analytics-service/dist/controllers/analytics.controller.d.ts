import { Request, Response, NextFunction } from 'express';
export declare function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getSpendAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getFraudAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
