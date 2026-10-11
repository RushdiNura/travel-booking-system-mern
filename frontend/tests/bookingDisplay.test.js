import { describe, it, expect } from 'vitest';
import { bookingTitle, STATUS_VARIANT, PAYMENT_VARIANT } from '../src/lib/bookingDisplay.js';

describe('bookingTitle', () => {
  it('formats a flight booking as origin → destination', () => {
    const booking = {
      bookingType: 'flight',
      flight: { flightRef: { origin: { code: 'JFK' }, destination: { code: 'LIS' } } },
    };
    expect(bookingTitle(booking)).toBe('JFK → LIS');
  });

  it('falls back to placeholders when flight route data is missing', () => {
    const booking = { bookingType: 'flight', flight: { flightRef: null } };
    expect(bookingTitle(booking)).toBe('? → ?');
  });

  it('uses the hotel name for hotel bookings', () => {
    const booking = { bookingType: 'hotel', hotel: { hotelRef: { name: 'Casa do Horizonte' } } };
    expect(bookingTitle(booking)).toBe('Casa do Horizonte');
  });

  it('falls back to a generic label when the hotel ref is missing', () => {
    const booking = { bookingType: 'hotel', hotel: {} };
    expect(bookingTitle(booking)).toBe('Hotel booking');
  });

  it('uses the package title for package bookings', () => {
    const booking = { bookingType: 'package', package: { packageRef: { title: 'Kyoto: Temples & Tea' } } };
    expect(bookingTitle(booking)).toBe('Kyoto: Temples & Tea');
  });

  it('returns a generic label for an unrecognized booking type', () => {
    expect(bookingTitle({ bookingType: 'unknown' })).toBe('Booking');
  });
});

describe('status/payment badge variant maps', () => {
  it('maps every real booking status to a defined badge variant', () => {
    const statuses = ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED'];
    for (const status of statuses) {
      expect(STATUS_VARIANT[status]).toBeDefined();
    }
  });

  it('maps every real payment status to a defined badge variant', () => {
    const statuses = ['UNPAID', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];
    for (const status of statuses) {
      expect(PAYMENT_VARIANT[status]).toBeDefined();
    }
  });
});
