import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { withTransaction } from '../utils/transaction.js';
import { env } from '../config/env.js';
import { paymentProvider } from './providers/PaymentProvider.js';
import { confirmBooking } from './bookingService.js';
import * as notificationService from './notificationService.js';

/**
 * Creates (or resumes) a Stripe PaymentIntent for a booking hold. Safe to
 * call repeatedly — if a PaymentIntent already exists for this booking,
 * its current client secret is re-returned rather than creating a
 * duplicate charge, so a user refreshing the payment page doesn't
 * accumulate stray intents.
 */
export async function createIntentForBooking(booking) {
  if (booking.status !== 'PAYMENT_PENDING') {
    throw ApiError.conflict(`Cannot pay for a booking in status ${booking.status}`);
  }
  if (booking.holdExpiresAt && booking.holdExpiresAt.getTime() < Date.now()) {
    throw ApiError.conflict('This booking hold has expired. Please start a new search.');
  }

  let payment = await Payment.findOne({ booking: booking._id });
  let intent;

  if (payment?.providerPaymentIntentId) {
    intent = await paymentProvider.retrievePaymentIntent(payment.providerPaymentIntentId);
  } else {
    intent = await paymentProvider.createPaymentIntent({
      amount: booking.pricing.total,
      currency: booking.pricing.currency,
      bookingId: booking._id,
      metadata: { bookingReference: booking.bookingReference },
    });

    payment = await Payment.create({
      booking: booking._id,
      user: booking.user,
      provider: 'stripe',
      providerPaymentIntentId: intent.id,
      amount: booking.pricing.total,
      currency: booking.pricing.currency,
      status: 'REQUIRES_PAYMENT',
    });

    booking.payment = payment._id;
    booking.paymentStatus = 'PROCESSING';
    await booking.save();
  }

  return {
    clientSecret: intent.clientSecret,
    publishableKey: env.stripe.publishableKey,
    amount: booking.pricing.total,
    currency: booking.pricing.currency,
  };
}

/**
 * Processes a Stripe webhook event whose signature has already been
 * verified by the caller (see paymentController). This is the ONLY path
 * that confirms a booking as paid — nothing on the client can trigger it.
 */
export async function handleWebhookEvent(event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      return handlePaymentSucceeded(event);
    case 'payment_intent.payment_failed':
      return handlePaymentFailed(event);
    case 'charge.refunded':
      return handleChargeRefunded(event);
    default:
      // Stripe sends many event types we don't act on — ignoring unknown
      // ones is correct and expected, not an error.
      return null;
  }
}

async function alreadyProcessed(payment, eventId) {
  return payment.events?.some((e) => e.eventId === eventId);
}

async function handlePaymentSucceeded(event) {
  const intent = event.data.object;
  const payment = await Payment.findOne({ providerPaymentIntentId: intent.id });
  if (!payment) {
    logger.warn(`Webhook payment_intent.succeeded for unknown intent ${intent.id}`);
    return null;
  }
  if (await alreadyProcessed(payment, event.id)) return payment; // idempotent replay

  const booking = await Booking.findById(payment.booking);
  if (!booking) {
    logger.error(`Payment ${payment._id} succeeded but its booking no longer exists`);
    return null;
  }

  // Sanity-check the provider's charged amount against our own
  // authoritative pricing before confirming — catches drift or tampering
  // between intent creation and this event.
  const expectedAmount = Math.round(booking.pricing.total * 100);
  const amountMatches = intent.amount === expectedAmount;
  const currencyMatches = intent.currency.toUpperCase() === booking.pricing.currency.toUpperCase();

  if (!amountMatches || !currencyMatches) {
    logger.error(
      `Amount/currency mismatch confirming booking ${booking.bookingReference}: ` +
        `expected ${expectedAmount} ${booking.pricing.currency}, got ${intent.amount} ${intent.currency}`
    );
    payment.status = 'FAILED';
    payment.failureReason = 'Payment amount did not match booking total';
    payment.events.push({ eventId: event.id, type: event.type });
    await payment.save();
    return payment;
  }

  payment.status = 'SUCCEEDED';
  payment.providerChargeId = intent.latest_charge || payment.providerChargeId;
  payment.events.push({ eventId: event.id, type: event.type });
  await payment.save();

  await withTransaction((session) => confirmBooking(booking._id, session));

  const confirmed = await Booking.findById(booking._id);
  await notificationService.notifyBookingConfirmed(confirmed);
  return payment;
}

async function handlePaymentFailed(event) {
  const intent = event.data.object;
  const payment = await Payment.findOne({ providerPaymentIntentId: intent.id });
  if (!payment) return null;
  if (await alreadyProcessed(payment, event.id)) return payment;

  payment.status = 'FAILED';
  payment.failureReason = intent.last_payment_error?.message || 'Payment failed';
  payment.events.push({ eventId: event.id, type: event.type });
  await payment.save();

  const booking = await Booking.findById(payment.booking);
  // The hold stays active (see module note): a failed attempt doesn't
  // release inventory immediately, only the expiration job does that.
  // This lets a user retry with a different card within the hold window.
  if (booking && booking.status === 'PAYMENT_PENDING') {
    booking.paymentStatus = 'FAILED';
    await booking.save();
    await notificationService.notifyPaymentFailed(booking);
  }
  return payment;
}

async function handleChargeRefunded(event) {
  const charge = event.data.object;
  const payment = await Payment.findOne({ providerPaymentIntentId: charge.payment_intent });
  if (!payment) return null;
  if (await alreadyProcessed(payment, event.id)) return payment;

  payment.events.push({ eventId: event.id, type: event.type });
  if (charge.refunded) {
    payment.status = 'REFUNDED';
  }
  await payment.save();

  const booking = await Booking.findById(payment.booking);
  if (booking && booking.cancellation?.status !== 'REFUNDED' && charge.refunded) {
    booking.cancellation.status = 'REFUNDED';
    booking.paymentStatus = 'REFUNDED';
    await booking.save();
    await notificationService.notifyRefundIssued(booking);
  }
  return payment;
}

/**
 * Initiates a real refund with the payment provider for a booking whose
 * cancellation was already marked REFUND_PENDING by bookingService. Runs
 * outside any DB transaction, since it makes a network call to Stripe —
 * mixing a long-lived external call into a Mongo transaction would hold
 * locks unnecessarily long. The webhook handler above is the ultimate
 * source of truth if this call's immediate response and the async webhook
 * ever disagree.
 */
export async function refundBookingPayment(booking) {
  if (!booking.payment) {
    logger.warn(`Booking ${booking.bookingReference} has no linked payment; cannot refund`);
    return booking;
  }

  const payment = await Payment.findById(booking.payment);
  if (!payment || payment.status !== 'SUCCEEDED') {
    logger.warn(`Payment for booking ${booking.bookingReference} is not in a refundable state`);
    return booking;
  }

  try {
    const refund = await paymentProvider.createRefund({
      paymentIntentId: payment.providerPaymentIntentId,
      amount: booking.cancellation.refundAmount,
      reason: 'requested_by_customer',
    });

    payment.refunds.push({
      refundId: refund.id,
      amount: refund.amount,
      reason: 'requested_by_customer',
      status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
    });
    if (refund.status === 'succeeded') payment.status = 'REFUNDED';
    await payment.save();

    booking.cancellation.refundId = refund.id;
    if (refund.status === 'succeeded') {
      booking.cancellation.status = 'REFUNDED';
      booking.paymentStatus = 'REFUNDED';
      await booking.save();
      await notificationService.notifyRefundIssued(booking);
    } else {
      // Refund accepted by Stripe but not yet finalized — the
      // charge.refunded webhook above will flip this to REFUNDED.
      await booking.save();
    }

    return booking;
  } catch (err) {
    logger.error(`Refund failed for booking ${booking.bookingReference}: ${err.message}`);
    booking.cancellation.status = 'REFUND_FAILED';
    await booking.save();
    return booking;
  }
}
