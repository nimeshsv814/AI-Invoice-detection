import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { sendError } from '../utils/response';

export class AppError extends Error {
  public statusCode: number;
  public errors: any;

  constructor(message: string, statusCode = 500, errors: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || null;

  // Log errors
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.url} - ${message}\nStack: ${err.stack}`);
  } else {
    logger.warn(`${req.method} ${req.url} - ${statusCode} - ${message}`);
  }

  sendError(res, message, statusCode, errors);
}
