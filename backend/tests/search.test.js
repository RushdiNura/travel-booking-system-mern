import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js';
import { createFlight, createDestination, createHotelWithRoom, createPackageWithDeparture } from './helpers/factory.js';

beforeAll(connectTestDB);
afterAll(closeTestDB);
beforeEach(clearTestDB);

describe('Flight search', () => {
  it('finds flights matching origin, destination, and date', async () => {
    const flight = await createFlight();
    const dateStr = flight.departureTime.toISOString().slice(0, 10);

    const res = await request(app)
      .get('/api/flights')
      .query({ origin: 'AAA', destination: 'BBB', departureDate: dateStr, cabin: 'economy' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(flight._id.toString());
  });

  it('excludes flights without enough available seats for the requested traveler count', async () => {
    await createFlight({ cabinClasses: [{ cabin: 'economy', price: 200, totalSeats: 1, availableSeats: 1 }] });

    const res = await request(app).get('/api/flights').query({ origin: 'AAA', destination: 'BBB', travelers: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  it('paginates results', async () => {
    for (let i = 0; i < 3; i++) await createFlight();
    const res = await request(app).get('/api/flights').query({ origin: 'AAA', destination: 'BBB', limit: 2, page: 1 });
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(3);
    expect(res.body.meta.totalPages).toBe(2);
  });

  it('rejects a malformed flight id', async () => {
    const res = await request(app).get('/api/flights/not-a-valid-id');
    expect(res.status).toBe(422);
  });
});

describe('Hotel search', () => {
  it('finds hotels for a destination with availability for the requested dates', async () => {
    const dest = await createDestination();
    const { hotel } = await createHotelWithRoom(dest._id);

    const res = await request(app)
      .get('/api/hotels')
      .query({ destination: dest.slug, checkIn: '2027-06-01', checkOut: '2027-06-03', rooms: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.some((h) => h._id === hotel._id.toString())).toBe(true);
  });

  it('excludes hotels with no room type able to cover every night of the stay', async () => {
    const dest = await createDestination();
    const { hotel, roomType } = await createHotelWithRoom(dest._id, {}, { defaultQuantity: 1 });
    // Manually hold the only room on one of the two requested nights.
    roomType.nights.push({ date: '2027-06-02', total: 1, held: 1, booked: 0 });
    await roomType.save();

    const res = await request(app)
      .get('/api/hotels')
      .query({ destination: dest.slug, checkIn: '2027-06-01', checkOut: '2027-06-03', rooms: 1 });

    expect(res.body.data.some((h) => h._id === hotel._id.toString())).toBe(false);
  });

  it('returns per-night room availability for a hotel', async () => {
    const dest = await createDestination();
    const { hotel } = await createHotelWithRoom(dest._id);

    const res = await request(app)
      .get(`/api/hotels/${hotel._id}/availability`)
      .query({ checkIn: '2027-06-01', checkOut: '2027-06-03' });

    expect(res.status).toBe(200);
    expect(res.body.data[0].canBook).toBe(true);
    expect(res.body.data[0].totalPriceEstimate).toBe(200); // $100/night * 2 nights * 1 room
  });
});

describe('Package search', () => {
  it('finds packages for a destination', async () => {
    const dest = await createDestination();
    const pkg = await createPackageWithDeparture(dest._id);

    const res = await request(app).get('/api/packages').query({ destination: dest.slug });
    expect(res.status).toBe(200);
    expect(res.body.data.some((p) => p._id === pkg._id.toString())).toBe(true);
  });

  it('surfaces remaining departure-date slots on the detail endpoint', async () => {
    const dest = await createDestination();
    const pkg = await createPackageWithDeparture(dest._id);

    const res = await request(app).get(`/api/packages/${pkg._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.departureDates[0].availableSlots).toBe(1);
  });
});
