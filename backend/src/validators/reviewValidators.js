import { body, query, param } from 'express-validator';

export const listReviewsRules = [
  query('targetType').isIn(['hotel', 'package', 'destination']).withMessage('Invalid targetType'),
  query('targetId').isMongoId().withMessage('Invalid targetId'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
];

export const createReviewRules = [
  body('bookingId').isMongoId().withMessage('Valid bookingId is required'),
  body('targetType').isIn(['hotel', 'package', 'destination']).withMessage('Invalid targetType'),
  body('targetId').isMongoId().withMessage('Invalid targetId'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').trim().notEmpty().isLength({ max: 120 }).withMessage('Title is required (max 120 chars)'),
  body('comment').trim().notEmpty().isLength({ max: 2000 }).withMessage('Comment is required (max 2000 chars)'),
];

export const updateReviewRules = [
  param('id').isMongoId(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('title').optional().trim().notEmpty().isLength({ max: 120 }),
  body('comment').optional().trim().notEmpty().isLength({ max: 2000 }),
];

export const moderateReviewRules = [
  param('id').isMongoId(),
  body('isHidden').isBoolean().toBoolean(),
  body('moderationNote').optional().trim().isLength({ max: 500 }),
];
