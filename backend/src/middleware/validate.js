import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Runs after an array of express-validator checks. Collects all failures
 * into one 422 response instead of failing on the first check.
 */
export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  next(ApiError.unprocessable('Validation failed', details));
};
