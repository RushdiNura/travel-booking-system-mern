import { body, param } from 'express-validator';

export const createItineraryRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('destination').optional().isMongoId(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
];

export const updateItineraryRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
];

export const addItemRules = [
  param('id').isMongoId(),
  body('day').isInt({ min: 1 }).withMessage('day must be a positive integer'),
  body('type').isIn(['flight', 'hotel', 'activity', 'meal', 'transport', 'note']).withMessage('Invalid item type'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('time').optional().trim(),
  body('description').optional().trim(),
  body('location').optional().trim(),
];

export const updateItemRules = [
  param('id').isMongoId(),
  param('itemId').isMongoId(),
];
