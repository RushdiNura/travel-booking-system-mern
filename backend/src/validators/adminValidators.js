import { body, param } from 'express-validator';

export const userStatusRules = [
  param('id').isMongoId(),
  body('isActive').isBoolean().withMessage('isActive must be true or false').toBoolean(),
];

export const userRoleRules = [
  param('id').isMongoId(),
  body('role').isIn(['user', 'admin']).withMessage('role must be user or admin'),
];

export const mongoIdParamRules = [param('id').isMongoId().withMessage('Invalid id')];
export const hotelIdParamRules = [param('hotelId').isMongoId().withMessage('Invalid hotel id')];

// Inventory create/update bodies are intentionally light on express-validator
// rules — Mongoose schema validation (required fields, enums, min/max) is
// the authoritative check and already returns clean 422s via the global
// error handler. These rules catch the most common malformed-id mistakes
// before that.
export const flightWriteRules = [
  body('flightNumber').optional().trim().notEmpty(),
  body('origin.code').optional().trim().isLength({ min: 3, max: 4 }),
  body('destination.code').optional().trim().isLength({ min: 3, max: 4 }),
  body('departureTime').optional().isISO8601(),
  body('arrivalTime').optional().isISO8601(),
];

export const hotelWriteRules = [
  body('destination').optional().isMongoId().withMessage('destination must be a valid destination id'),
];
