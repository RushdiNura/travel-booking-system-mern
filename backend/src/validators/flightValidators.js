import { query, param } from 'express-validator';

export const searchFlightsRules = [
  query('origin').optional().trim().isLength({ min: 3, max: 4 }).withMessage('Invalid origin airport code'),
  query('destination').optional().trim().isLength({ min: 3, max: 4 }).withMessage('Invalid destination airport code'),
  query('departureDate').optional().isISO8601().withMessage('departureDate must be YYYY-MM-DD'),
  query('returnDate').optional().isISO8601().withMessage('returnDate must be YYYY-MM-DD'),
  query('cabin').optional().isIn(['economy', 'premium_economy', 'business', 'first']),
  query('travelers').optional().isInt({ min: 1, max: 9 }).toInt(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('sort').optional().isIn(['cheapest', 'fastest', 'recommended', 'departure']),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('airline').optional().trim(),
  query('maxStops').optional().isInt({ min: 0, max: 3 }).toInt(),
];

export const flightIdParamRules = [param('id').isMongoId().withMessage('Invalid flight id')];
