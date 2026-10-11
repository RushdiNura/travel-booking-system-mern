import Stripe from 'stripe';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Abstract interface every payment provider must implement. Controllers
 * and services depend on this shape, never on Stripe's SDK directly, so
 * swapping or adding a provider (e.g. PayPal, Adyen) later doesn't ripple
 * through the codebase.
 */
class PaymentProviderInterface {
  async createPaymentIntent(_params /* { amount, currency, bookingId, metadata } */) {
    throw new Error('Not implemented');
  }
  async retrievePaymentIntent(_id) {
    throw new Error('Not implemented');
  }
  async createRefund(_params /* { paymentIntentId, amount, reason } */) {
    throw new Error('Not implemented');
  }
  verifyWebhookSignature(_rawBody, _signature) {
    throw new Error('Not implemented');
  }
  isConfigured() {
    return false;
  }
}

class StripePaymentProvider extends PaymentProviderInterface {
  constructor() {
    super();
    this.configured = env.stripe.configured;
    this.client = this.configured ? new Stripe(env.stripe.secretKey, { apiVersion: '2024-06-20' }) : null;
  }

  isConfigured() {
    return this.configured;
  }

  #assertConfigured() {
    if (!this.configured) {
      throw ApiError.internal(
        'Payments are not configured on this server. Set STRIPE_SECRET_KEY in the environment.'
      );
    }
  }

  async createPaymentIntent({ amount, currency, bookingId, metadata = {} }) {
    this.#assertConfigured();
    // Stripe expects the smallest currency unit (e.g. cents).
    const amountInSmallestUnit = Math.round(amount * 100);
    const intent = await this.client.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      metadata: { bookingId: String(bookingId), ...metadata },
      automatic_payment_methods: { enabled: true },
    });
    return {
      id: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status,
      amount: intent.amount / 100,
      currency: intent.currency,
    };
  }

  async retrievePaymentIntent(id) {
    this.#assertConfigured();
    const intent = await this.client.paymentIntents.retrieve(id);
    return {
      id: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status,
      amount: intent.amount / 100,
      currency: intent.currency,
      metadata: intent.metadata,
    };
  }

  async createRefund({ paymentIntentId, amount, reason }) {
    this.#assertConfigured();
    const refund = await this.client.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount ? { amount: Math.round(amount * 100) } : {}),
      ...(reason ? { reason: mapRefundReason(reason) } : {}),
    });
    return { id: refund.id, status: refund.status, amount: refund.amount / 100 };
  }

  verifyWebhookSignature(rawBody, signature) {
    this.#assertConfigured();
    if (!env.stripe.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set — cannot verify webhook signatures.');
    }
    return this.client.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
  }
}

function mapRefundReason(reason) {
  const allowed = ['duplicate', 'fraudulent', 'requested_by_customer'];
  return allowed.includes(reason) ? reason : 'requested_by_customer';
}

export const paymentProvider = new StripePaymentProvider();

if (!paymentProvider.isConfigured()) {
  logger.warn(
    '[PaymentProvider] Stripe is not configured (STRIPE_SECRET_KEY missing). ' +
      'Payment endpoints will return a clear configuration error until it is set.'
  );
}
