import { Router } from 'express';
import { convertCurrency, convertRules } from '../controllers/currencyController.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/convert', convertRules, validate, convertCurrency);

export default router;
