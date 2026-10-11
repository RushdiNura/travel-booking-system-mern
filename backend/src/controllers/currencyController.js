import { query } from 'express-validator';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { currencyProvider } from '../services/providers/CurrencyProvider.js';

export const convertRules = [
  query('amount').isFloat({ min: 0 }).withMessage('amount must be a positive number').toFloat(),
  query('from').trim().isLength({ min: 3, max: 3 }).withMessage('from must be a 3-letter currency code'),
  query('to').trim().isLength({ min: 3, max: 3 }).withMessage('to must be a 3-letter currency code'),
];

export const convertCurrency = asyncHandler(async (req, res) => {
  const { amount, from, to } = req.query;
  const result = await currencyProvider.convert({ amount, from: from.toUpperCase(), to: to.toUpperCase() });
  return new ApiResponse(200, result).send(res);
});
