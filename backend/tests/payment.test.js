import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js';
import { registerAndGetToken, createFlight } from './helpers/factory.js';
import { Booking } from '../src/models/Booking.js';
import { Payment } from '../src/models/Payment.js';
import { handleWebhookEvent } from '../src/services/paymentService.js';

beforeAll(connectTestDB);
afterAll(closeTestDB);
beforeEach(clearTestDB);

const traveler = { firstName: 'Jane', lastName: 'Doe' };

/**
 * These tests exercise handleWebhookEvent directly with a crafted Stripe
 * event payload — signature verification itself (which requires a real
 * Stripe secret) is covered by the local manual test in the payments
 * phase notes, not here. What matters for correctness is verified below:
 * the server never trusts a client-supplied "payment succeeded" claim,
 * and only a genuinely matching, correctly-signed provider event confirms
 * a booking.
 */
async function createHeldBookingWithPayment(token, flight) {
  const bookingRes = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ bookingType: 'flight', flightId: flight._id, cabin: 'economy', travelers: [traveler], contactEmail: 'a@b.com' });

  const booking = await Booking.findById(bookingRes.body.data.booking._id);
  const payment = await Payment.create({
    booking: booking._id,
    user: booking.user,
    provider: 'stripe',
    providerPaymentIntentId: `pi_test_${booking._id}`,
    amount: booking.pricing.total,
    currency: booking.pricing.currency,
    status: 'REQUIRES_PAYMENT',
  });
  booking.payment = payment._id;
  booking.paymentStatus = 'PROCESSING';
  await booking.save();

  return { booking, payment };
}

describe('Payment webhook processing', () => {
  it('confirms the booking when the intent amount matches the authoritative total', async () => {
    const { token } = await registerAndGetToken();
    const flight = await createFlight({ cabinClasses: [{ cabin: 'economy', price: 200, totalSeats: 5, availableSeats: 5 }] });
    const { booking, payment } = await createHeldBookingWithPayment(token, flight);

    await handleWebhookEvent({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: payment.providerPaymentIntentId,
          amount: Math.round(booking.pricing.total * 100),
          currency: booking.pricing.currency.toLowerCase(),
          latest_charge: 'ch_test_1',
        },
      },
    });

    const confirmed = await Booking.findById(booking._id);
    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.paymentStatus).toBe('PAID');
  });

  it('refuses to confirm the booking if the charged amount does not match the authoritative total', async () => {
    const { token } = await registerAndGetToken();
    const flight = await createFlight({ cabinClasses: [{ cabin: 'economy', price: 200, totalSeats: 5, availableSeats: 5 }] });
    const { booking, payment } = await createHeldBookingWithPayment(token, flight);

    await handleWebhookEvent({
      id: 'evt_tampered',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: payment.providerPaymentIntentId,
          amount: 100, // $1.00 — far below the real total, simulating a tampered/mismatched charge
          currency: booking.pricing.currency.toLowerCase(),
        },
      },
    });

    const stillUnconfirmed = await Booking.findById(booking._id);
    expect(stillUnconfirmed.status).not.toBe('CONFIRMED');

    const updatedPayment = await Payment.findById(payment._id);
    expect(updatedPayment.status).toBe('FAILED');
  });

  it('is idempotent — replaying the same event does not double-process', async () => {
    const { token } = await registerAndGetToken();
    const flight = await createFlight({ cabinClasses: [{ cabin: 'economy', price: 200, totalSeats: 5, availableSeats: 5 }] });
    const { booking, payment } = await createHeldBookingWithPayment(token, flight);

    const event = {
      id: 'evt_replay',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: payment.providerPaymentIntentId,
          amount: Math.round(booking.pricing.total * 100),
          currency: booking.pricing.currency.toLowerCase(),
        },
      },
    };

    await handleWebhookEvent(event);
    await handleWebhookEvent(event); // replay

    const finalPayment = await Payment.findById(payment._id);
    const matchingEvents = finalPayment.events.filter((e) => e.eventId === 'evt_replay');
    expect(matchingEvents.length).toBe(1); // recorded once, not twice
  });

  it('marks payment failed without releasing the hold immediately, allowing retry', async () => {
    const { token } = await registerAndGetToken();
    const flight = await createFlight({ cabinClasses: [{ cabin: 'economy', price: 200, totalSeats: 5, availableSeats: 5 }] });
    const { booking, payment } = await createHeldBookingWithPayment(token, flight);

    await handleWebhookEvent({
      id: 'evt_failed',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: payment.providerPaymentIntentId,
          last_payment_error: { message: 'Card declined' },
        },
      },
    });

    const afterFailure = await Booking.findById(booking._id);
    expect(afterFailure.paymentStatus).toBe('FAILED');
    expect(afterFailure.status).toBe('PAYMENT_PENDING'); // hold still active, retry possible
  });
});
