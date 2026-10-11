import request from 'supertest';
import { app } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Flight } from '../../src/models/Flight.js';
import { Hotel } from '../../src/models/Hotel.js';
import { RoomType } from '../../src/models/RoomType.js';
import { TravelPackage } from '../../src/models/TravelPackage.js';
import { Destination } from '../../src/models/Destination.js';

const rand = () => Math.random().toString(36).slice(2, 8);

export async function registerAndGetToken(overrides = {}) {
  const payload = {
    name: 'Test User',
    email: `user${rand()}@test.com`,
    password: 'TestPass123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { token: res.body?.data?.token, user: res.body?.data?.user, raw: res };
}

export async function createAdminAndGetToken() {
  const email = `admin${rand()}@test.com`;
  await User.create({ name: 'Test Admin', email, password: 'TestPass123', role: 'admin' });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'TestPass123' });
  return { token: res.body.data.token, user: res.body.data.user };
}

export async function createDestination(overrides = {}) {
  return Destination.create({
    name: 'Test City',
    slug: `test-city-${rand()}`,
    country: 'Testland',
    description: 'A test destination used only in automated tests.',
    coordinates: { lat: 0, lng: 0 },
    ...overrides,
  });
}

export async function createFlight(overrides = {}) {
  const departureTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const arrivalTime = new Date(departureTime.getTime() + 3 * 60 * 60 * 1000);
  return Flight.create({
    airline: { name: 'Test Air', code: 'TA' },
    flightNumber: `TA${rand()}`,
    origin: { code: 'AAA', city: 'Alpha', name: 'Alpha Intl', country: 'Testland' },
    destination: { code: 'BBB', city: 'Beta', name: 'Beta Intl', country: 'Testland' },
    departureTime,
    arrivalTime,
    durationMinutes: 180,
    cabinClasses: [{ cabin: 'economy', price: 200, totalSeats: 1, availableSeats: 1 }],
    ...overrides,
  });
}

export async function createHotelWithRoom(destinationId, overrides = {}, roomOverrides = {}) {
  const hotel = await Hotel.create({
    name: 'Test Hotel',
    slug: `test-hotel-${rand()}`,
    destination: destinationId,
    description: 'A test hotel used only in automated tests.',
    address: { city: 'Testville', country: 'Testland' },
    coordinates: { lat: 0, lng: 0 },
    ...overrides,
  });
  const roomType = await RoomType.create({
    hotel: hotel._id,
    name: 'Standard Room',
    capacity: { adults: 2, children: 0 },
    basePrice: 100,
    defaultQuantity: 1,
    ...roomOverrides,
  });
  return { hotel, roomType };
}

export async function createPackageWithDeparture(destinationId, overrides = {}) {
  return TravelPackage.create({
    title: 'Test Package',
    slug: `test-package-${rand()}`,
    destination: destinationId,
    description: 'A test package used only in automated tests.',
    durationDays: 5,
    durationNights: 4,
    price: 500,
    maxTravelersPerBooking: 4,
    departureDates: [{ startDate: '2027-01-01', totalSlots: 1 }],
    ...overrides,
  });
}

export { app };
