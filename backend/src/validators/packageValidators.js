import { query, param } from 'express-validator';

export const searchPackagesRules = [
  query('destination').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('minDuration').optional().isInt({ min: 1 }).toInt(),
  query('maxDuration').optional().isInt({ min: 1 }).toInt(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('sort').optional().isIn(['price', 'rating', 'recommended']),
];

export const packageIdParamRules = [param('id').isMongoId().withMessage('Invalid package id')];
