import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      status: err.status,
      code: err.code,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  logger.error(message, err instanceof Error ? err.stack : String(err));

  res.status(500).json({
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message,
  });
};
