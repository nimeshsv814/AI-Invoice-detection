import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare function register(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function login(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
