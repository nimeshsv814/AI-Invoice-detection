import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare function startWorkflow(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getWorkflow(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function performAction(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getQueue(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
