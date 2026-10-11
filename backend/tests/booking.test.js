import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js';
import { registerAndGetToken, createFlight, createDestination, createHotelWithRoom, createPackageWithDeparture } from './helpers/factory.js';
import { Flight } from '../src/models/Flight.js';
import { Booking } from '../src/models/Booking.js';
import { runExpirationSweep } from '../src/jobs/expireBookings.js';

beforeAll(connectTestDB);
afterAll(closeTestDB);
beforeEach(clearTestDB);

const traveler = { firstName: 'Jane', lastName: 'Doe' };

describe('Flight booking holds', () => {
  it('creates a hold and decrements available seats', async () => {
    const { token } = await registerAndGetToken();
    const flight = await createFlight();

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookingType: 'flight', flightId: flight._id, cabin: 'economy', travelers: [traveler], contactEmail: 'a@b.com' });

    expect(res.status).toBe(201);
    expect(res.body.data.booking.status).toBe('PAYMENT_PENDING');
    expect(res.body.data.booking.holdExpiresAt).toBeTruthy();

    const updated = await Flight.findById(flight._id);
    expect(updated.cabinClasses[0].availableSeats).toBe(0);
    expect(updated.cabinClasses[0].heldSeats).toBe(1);
  });

  it('prevents double-booking the last seat under concurrent requests', async () => {
    const { token: tokenA } = await registerAndGetToken();
    const { token: tokenB } = await registerAndGetToken();
    const flight = await createFlight({ cabinClasses: [{ cabin: 'economy', price: 200, totalSeats: 1, availableSeats: 1 }] });

    const payload = (contactEmail) => ({
      bookingType: 'flight',
      flightId: flight._id,
      cabin: 'economy',
      travelers: [traveler],
      contactEmail,
    });

    const [resA, resB] = await Promise.all([
      request(app).post('/api/bookings').set('Authorization', `Bearer ${tokenA}`).send(payload('a@test.com')),
      request(app).post('/api/bookings').set('Authorization', `Bearer ${tokenB}`).send(payload('b@test.com')),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]); // exactly one succeeds, one is rejected as a conflict

    const finalFlight = await Flight.findById(flight._id);
    expect(finalFlight.cabinClasses[0].availableSeats).toBe(0); // never went negative, never double-sold
  });

  it('rejects booking a flight cabin with zero seats left', async () => {
    const { token } = await registerAndGetToken();
    const flight = await createFlight({ cabinClasses: [{ cabin: 'economy', price: 200, totalSeats: 1, availableSeats: 0, heldSeats: 1 }] });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookingType: 'flight', flightId: flight._id, cabin: 'economy', travelers: [traveler], contactEmail: 'a@b.com' });

    expect(res.status).toBe(409);
  });

  it('computes the total server-side, ignoring any client-supplied price', async () => {
    const { token } = await registerAndGetToken();
    const flight = await createFlight({ cabinClasses: [{ cabin: 'economy', price: 200, totalSeats: 5, availableSeats: 5 }] });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bookingType: 'flight',
        flightId: flight._id,
        cabin: 'economy',
        travelers: [traveler],
        contactEmail: 'a@b.com',
        pricing: { total: 1 }, // attempted client tampering — must be ignored entirely
      });

    expect(res.status).toBe(201);
    expect(res.body.data.booking.pricing.total).not.toBe(1);
    expect(res.body.data.booking.pricing.basePrice).toBe(200); // 1 traveler * $200, untouched by the spoofed field
  });
});

describe('Hotel booking holds', () => {
  it('prevents double-booking the last room on overlapping nights', async () => {
    const dest = await createDestination();
    const { hotel, roomType } = await createHotelWithRoom(dest._id, {}, { defaultQuantity: 1 });
    const { token: tokenA } = await registerAndGetToken();
    const { token: tokenB } = await registerAndGetToken();

    const payload = (contactEmail) => ({
      bookingType: 'hotel',
      hotelId: hotel._id,
      roomTypeId: roomType._id,
      checkIn: '2027-06-01',
      checkOut: '2027-06-03',
      rooms: 1,
      travelers: [traveler],
      contactEmail,
    });

    const [resA, resB] = await Promise.all([
      request(app).post('/api/bookings').set('Authorization', `Bearer ${tokenA}`).send(payload('a@test.com')),
      request(app).post('/api/bookings').set('Authorization', `Bearer ${tokenB}`).send(payload('b@test.com')),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);
  });
});

describe('Package booking holds', () => {
  it('prevents overbooking the last traveler slot on a departure date', async () => {
    const dest = await createDestination();
    const pkg = await createPackageWithDeparture(dest._id, { departureDates: [{ startDate: '2027-01-01', totalSlots: 1 }] });
    const { token: tokenA } = await registerAndGetToken();
    const { token: tokenB } = await registerAndGetToken();

    const payload = (contactEmail) => ({
      bookingType: 'package',
      packageId: pkg._id,
      departureDateId: pkg.departureDates[0]._id,
      travelerSlots: 1,
      travelers: [traveler],
      contactEmail,
    });

    const [resA, resB] = await Promise.all([
      request(app).post('/api/bookings').set('Authorization', `Bearer ${tokenA}`).send(payload('a@test.com')),
      request(app).post('/api/bookings').set('Authorization', `Bearer ${tokenB}`).send(payload('b@test.com')),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);
  });
});

describe('Hold expiration', () => {
  it('releases inventory and marks the booking EXPIRED once the hold passes', async () => {
    const { token } = await registerAndGetToken();
    const flight = await createFlight({ cabinClasses: [{ cabin: 'economy', price: 200, totalSeats: 1, availableSeats: 1 }] });

    const createRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookingType: 'flight', flightId: flight._id, cabin: 'economy', travelers: [traveler], contactEmail: 'a@b.com' });

    const bookingId = createRes.body.data.booking._id;

    // Force the hold into the past rather than waiting for real time to pass.
    await Booking.updateOne({ _id: bookingId }, { holdExpiresAt: new Date(Date.now() - 1000) });

    await runExpirationSweep();

    const booking = await Booking.findById(bookingId);
    expect(booking.status).toBe('EXPIRED');

    const releasedFlight = await Flight.findById(flight._id);
    expect(releasedFlight.cabinClasses[0].availableSeats).toBe(1); // back to full availability
    expect(releasedFlight.cabinClasses[0].heldSeats).toBe(0);
  });
});

describe('Cancellation', () => {
  it('lets the owner cancel an unpaid hold and releases inventory', async () => {
    const { token } = await registerAndGetToken();
    const flight = await createFlight({ cabinClasses: [{ cabin: 'economy', price: 200, totalSeats: 1, availableSeats: 1 }] });

    const createRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookingType: 'flight', flightId: flight._id, cabin: 'economy', travelers: [traveler], contactEmail: 'a@b.com' });

    const bookingId = createRes.body.data.booking._id;

    const cancelRes = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Changed my mind' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    const releasedFlight = await Flight.findById(flight._id);
    expect(releasedFlight.cabinClasses[0].availableSeats).toBe(1);
  });
});
