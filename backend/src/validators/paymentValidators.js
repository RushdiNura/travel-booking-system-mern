import { body } from 'express-validator';

export const createIntentRules = [body('bookingId').isMongoId().withMessage('Valid bookingId is required')];
