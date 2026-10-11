import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

const normalizeError = (err) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return ApiError.unprocessable('Validation failed', details);
  }
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }
  // Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`${field} already exists`);
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError') return ApiError.unauthorized('Invalid token');
  if (err.name === 'TokenExpiredError') return ApiError.unauthorized('Session expired, please log in again');

  if (err instanceof ApiError) return err;

  // Unknown/unexpected error — never leak internals to the client.
  return ApiError.internal();
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  const apiError = normalizeError(err);

  if (!apiError.isOperational || apiError.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`, { stack: err.stack });
  } else if (!env.isTest) {
    logger.warn(`${req.method} ${req.originalUrl} -> ${apiError.statusCode} ${apiError.message}`);
  }

  res.status(apiError.statusCode).json({
    success: false,
    statusCode: apiError.statusCode,
    message: apiError.message,
    ...(apiError.details ? { details: apiError.details } : {}),
    // Stack traces only ever appear outside production, and only in logs above—
    // never in this response body.
  });
};
