import { Response } from 'express';

export function sendSuccess(res: Response, data: any, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendCreated(res: Response, data: any, message = 'Created') {
  return sendSuccess(res, data, message, 201);
}

export function sendPaginated(res: Response, data: any[], total: number, page: number, limit: number, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export function sendError(res: Response, message: string, statusCode = 500, errors: any = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
