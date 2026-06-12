import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.utils';
import { AppError } from './error.middleware';
import { getRedisClient } from '../config/redis';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token missing or invalid', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new AppError('Token has expired', 401));
    } else if (err.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401));
    } else {
      next(err);
    }
  }
}

export function authorize(roles: string[] | string, ...moreRoles: string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles, ...moreRoles];
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access forbidden: insufficient permissions', 403));
    }
    next();
  };
}
