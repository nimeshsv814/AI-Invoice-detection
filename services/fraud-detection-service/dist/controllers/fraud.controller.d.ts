import { Request, Response, NextFunction } from 'express';
export declare function analyzeInvoice(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getScore(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getTrends(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getHighRiskVendors(req: Request, res: Response, next: NextFunction): Promise<void>;
