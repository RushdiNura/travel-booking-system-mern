import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createIntentRules } from '../validators/paymentValidators.js';

const router = Router();

router.post('/create-intent', protect, createIntentRules, validate, paymentController.createPaymentIntent);

export default router;
