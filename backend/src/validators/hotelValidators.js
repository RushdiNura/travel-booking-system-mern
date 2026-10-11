import { query, param } from 'express-validator';

export const searchHotelsRules = [
  query('destination').optional().trim(),
  query('city').optional().trim(),
  query('checkIn').optional().isISO8601(),
  query('checkOut').optional().isISO8601(),
  query('guests').optional().isInt({ min: 1, max: 20 }).toInt(),
  query('rooms').optional().isInt({ min: 1, max: 10 }).toInt(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('starRating').optional().isInt({ min: 1, max: 5 }).toInt(),
  query('breakfastIncluded').optional().isBoolean().toBoolean(),
  query('freeCancellation').optional().isBoolean().toBoolean(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('sort').optional().isIn(['price', 'rating', 'recommended']),
];

export const hotelIdParamRules = [param('id').isMongoId().withMessage('Invalid hotel id')];

export const roomAvailabilityRules = [
  param('id').isMongoId().withMessage('Invalid hotel id'),
  query('checkIn').isISO8601().withMessage('checkIn is required (YYYY-MM-DD)'),
  query('checkOut').isISO8601().withMessage('checkOut is required (YYYY-MM-DD)'),
  query('rooms').optional().isInt({ min: 1, max: 10 }).toInt(),
];
