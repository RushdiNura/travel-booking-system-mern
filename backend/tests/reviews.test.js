import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js';
import { registerAndGetToken, createDestination, createHotelWithRoom } from './helpers/factory.js';
import { Booking } from '../src/models/Booking.js';

beforeAll(connectTestDB);
afterAll(closeTestDB);
beforeEach(clearTestDB);

async function createBookingWithStatus(userId, hotel, status) {
  return Booking.create({
    user: userId,
    bookingType: 'hotel',
    hotel: { hotelRef: hotel._id, roomsBooked: 1, checkIn: '2027-01-01', checkOut: '2027-01-03', nights: 2 },
    travelers: [{ firstName: 'Jane', lastName: 'Doe' }],
    contactEmail: 'a@b.com',
    pricing: { basePrice: 200, taxes: 16, fees: 15, discount: 0, total: 231, currency: 'USD' },
    status,
    paymentStatus: status === 'COMPLETED' || status === 'CONFIRMED' ? 'PAID' : 'UNPAID',
  });
}

describe('Reviews', () => {
  it('allows a review from a user with a completed booking for that hotel', async () => {
    const { token, user } = await registerAndGetToken();
    const dest = await createDestination();
    const { hotel } = await createHotelWithRoom(dest._id);
    const booking = await createBookingWithStatus(user._id, hotel, 'COMPLETED');

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookingId: booking._id, targetType: 'hotel', targetId: hotel._id, rating: 5, title: 'Great stay', comment: 'Loved it.' });

    expect(res.status).toBe(201);
  });

  it('rejects a review from a booking that is not yet completed', async () => {
    const { token, user } = await registerAndGetToken();
    const dest = await createDestination();
    const { hotel } = await createHotelWithRoom(dest._id);
    const booking = await createBookingWithStatus(user._id, hotel, 'CONFIRMED');

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookingId: booking._id, targetType: 'hotel', targetId: hotel._id, rating: 5, title: 'Too soon', comment: 'Not back yet.' });

    expect(res.status).toBe(400);
  });

  it('rejects a duplicate review on the same booking', async () => {
    const { token, user } = await registerAndGetToken();
    const dest = await createDestination();
    const { hotel } = await createHotelWithRoom(dest._id);
    const booking = await createBookingWithStatus(user._id, hotel, 'COMPLETED');

    const payload = { bookingId: booking._id, targetType: 'hotel', targetId: hotel._id, rating: 5, title: 'Great', comment: 'Loved it.' };
    const first = await request(app).post('/api/reviews').set('Authorization', `Bearer ${token}`).send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/reviews').set('Authorization', `Bearer ${token}`).send(payload);
    expect(second.status).toBe(409);
  });

  it("rejects reviewing someone else's booking", async () => {
    const { token: tokenA } = await registerAndGetToken();
    const { user: userB } = await registerAndGetToken();
    const dest = await createDestination();
    const { hotel } = await createHotelWithRoom(dest._id);
    const bookingOwnedByB = await createBookingWithStatus(userB._id, hotel, 'COMPLETED');

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ bookingId: bookingOwnedByB._id, targetType: 'hotel', targetId: hotel._id, rating: 1, title: 'Not mine', comment: 'x' });

    expect(res.status).toBe(403);
  });

  it('rejects a review whose target does not match what the booking actually covers', async () => {
    const { token, user } = await registerAndGetToken();
    const dest = await createDestination();
    const { hotel } = await createHotelWithRoom(dest._id);
    const { hotel: unrelatedHotel } = await createHotelWithRoom(dest._id);
    const booking = await createBookingWithStatus(user._id, hotel, 'COMPLETED');

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookingId: booking._id, targetType: 'hotel', targetId: unrelatedHotel._id, rating: 5, title: 'Wrong target', comment: 'x' });

    expect(res.status).toBe(400);
  });
});
