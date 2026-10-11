import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';
import { paymentProvider } from '../services/providers/PaymentProvider.js';
import * as paymentService from '../services/paymentService.js';

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');

  const isOwner = booking.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.notFound('Booking not found'); // don't confirm existence to non-owners
  }

  const result = await paymentService.createIntentForBooking(booking);
  return new ApiResponse(200, result, 'Payment intent ready').send(res);
});

/**
 * Stripe webhook endpoint. Mounted in app.js with express.raw() BEFORE the
 * global JSON body parser, since Stripe's signature verification requires
 * the exact raw request bytes — a parsed/re-serialized body will fail
 * verification even if the content is logically identical.
 */
export const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) throw ApiError.badRequest('Missing Stripe-Signature header');

  let event;
  try {
    event = paymentProvider.verifyWebhookSignature(req.body, signature);
  } catch (err) {
    logger.warn(`Stripe webhook signature verification failed: ${err.message}`);
    throw ApiError.badRequest('Invalid webhook signature');
  }

  await paymentService.handleWebhookEvent(event);

  // Stripe only cares that we acknowledged receipt; the response body is
  // ignored by Stripe but useful for manual debugging.
  res.status(200).json({ received: true, type: event.type });
});
