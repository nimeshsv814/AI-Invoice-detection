import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare function getVendors(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getVendor(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createVendor(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function updateVendor(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function assessVendor(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
