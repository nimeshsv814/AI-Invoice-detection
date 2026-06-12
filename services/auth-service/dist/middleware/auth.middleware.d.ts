import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../utils/jwt.utils';
export interface AuthRequest extends Request {
    user?: TokenPayload;
}
export declare function authenticate(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function authorize(roles: string[] | string, ...moreRoles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
