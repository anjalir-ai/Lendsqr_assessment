import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: error.flatten() }
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    return;
  }

  res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected server error' } });
};
