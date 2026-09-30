import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors.js';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: { code: error.code, message: error.message, details: error.details },
    });
    return;
  }

  if (error instanceof SyntaxError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } });
    return;
  }

  console.error(error);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};
