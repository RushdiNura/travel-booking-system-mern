import { body } from 'express-validator';

export const generatePlanRules = [
  body('destination').trim().notEmpty().withMessage('Destination is required').isLength({ max: 100 }),
  body('durationDays').isInt({ min: 1, max: 21 }).withMessage('durationDays must be between 1 and 21').toInt(),
  body('budget').optional().trim().isLength({ max: 60 }),
  body('travelers').optional().isInt({ min: 1, max: 20 }).toInt(),
  body('interests').optional().isArray({ max: 10 }),
  body('interests.*').optional().trim().isLength({ max: 40 }),
  body('travelStyle').optional().trim().isLength({ max: 60 }),
];
