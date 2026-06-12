import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export function validateRegister(req: Request, res: Response, next: NextFunction) {
  const { email, password, firstName, lastName, roleName } = req.body;

  const errors: Record<string, string> = {};
  if (!email || !/\S+@\S+\.\S+/.test(email)) errors.email = 'Valid email is required';
  if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (!firstName || firstName.trim().length === 0) errors.firstName = 'First name is required';
  if (!lastName || lastName.trim().length === 0) errors.lastName = 'Last name is required';
  if (!roleName) errors.roleName = 'Role name is required';

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Validation failed', 400, errors));
  }
  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;

  const errors: Record<string, string> = {};
  if (!email || !/\S+@\S+\.\S+/.test(email)) errors.email = 'Valid email is required';
  if (!password) errors.password = 'Password is required';

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Validation failed', 400, errors));
  }
  next();
}
