import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { logger } from '../utils/logger.js';

import { User } from '../models/User.js';
import { Destination } from '../models/Destination.js';
import { Flight } from '../models/Flight.js';
import { Hotel } from '../models/Hotel.js';
import { RoomType } from '../models/RoomType.js';
import { TravelPackage } from '../models/TravelPackage.js';
import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';

import { destinationsSeed } from './data/destinations.js';
import { flightsSeed } from './data/flights.js';
import { hotelsSeed, roomTypesSeed } from './data/hotels.js';
import { packagesSeed } from './data/packages.js';
import { usersSeed } from './data/users.js';
import { reviewsSeed } from './data/reviews.js';

const shouldDestroyOnly = process.argv.includes('--destroy');

const destroyAll = async () => {
  await Promise.all([
    User.deleteMany({}),
    Destination.deleteMany({}),
    Flight.deleteMany({}),
    Hotel.deleteMany({}),
    RoomType.deleteMany({}),
    TravelPackage.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
  ]);
  logger.info('All collections cleared.');
};

const seed = async () => {
  await connectDB();

  if (shouldDestroyOnly) {
    await destroyAll();
    await disconnectDB();
    process.exit(0);
  }

  logger.info('Clearing existing data before reseeding...');
  await destroyAll();

  // ── Users ────────────────────────────────────────────────────────
  logger.info('Seeding users...');
  const users = [];
  for (const u of usersSeed) {
    users.push(await User.create(u));
  }
  const userByEmail = Object.fromEntries(users.map((u) => [u.email, u]));

  // ── Destinations ─────────────────────────────────────────────────
  logger.info('Seeding destinations...');
  const destinations = await Destination.insertMany(destinationsSeed);
  const destBySlug = Object.fromEntries(destinations.map((d) => [d.slug, d]));

  // ── Flights ──────────────────────────────────────────────────────
  logger.info('Seeding flights...');
  await Flight.insertMany(flightsSeed);

  // ── Hotels + room types ─────────────────────────────────────────
  logger.info('Seeding hotels and room types...');
  const hotels = [];
  for (const h of hotelsSeed) {
    const dest = destBySlug[h.destinationSlug];
    if (!dest) {
      logger.warn(`Skipping hotel "${h.name}" — unknown destination slug ${h.destinationSlug}`);
      continue;
    }
    const { destinationSlug, ...rest } = h;
    const hotel = await Hotel.create({ ...rest, destination: dest._id });
    hotels.push(hotel);

    const rooms = roomTypesSeed[hotel.slug] || [];
    for (const r of rooms) {
      await RoomType.create({ ...r, hotel: hotel._id });
    }
  }
  const hotelBySlug = Object.fromEntries(hotels.map((h) => [h.slug, h]));

  // ── Packages ─────────────────────────────────────────────────────
  logger.info('Seeding holiday packages...');
  const packages = [];
  for (const p of packagesSeed) {
    const dest = destBySlug[p.destinationSlug];
    if (!dest) continue;
    const { destinationSlug, ...rest } = p;
    const pkg = await TravelPackage.create({ ...rest, destination: dest._id });
    packages.push(pkg);
  }
  const packageBySlug = Object.fromEntries(packages.map((p) => [p.slug, p]));

  // ── Reviews (with a matching completed booking each, to satisfy the
  // same eligibility constraint real reviews must meet) ─────────────
  logger.info('Seeding reviews...');
  for (const r of reviewsSeed) {
    const user = userByEmail[r.userEmail];
    if (!user) continue;

    let target;
    let bookingPayload;

    if (r.targetType === 'hotel') {
      target = hotelBySlug[r.hotelSlug];
      if (!target) continue;
      bookingPayload = {
        bookingType: 'hotel',
        hotel: { hotelRef: target._id, roomsBooked: 1, checkIn: '2026-01-10', checkOut: '2026-01-13', nights: 3 },
        pricing: { basePrice: 400, taxes: 40, fees: 10, discount: 0, total: 450, currency: 'USD' },
      };
    } else {
      target = packageBySlug[r.packageSlug];
      if (!target) continue;
      bookingPayload = {
        bookingType: 'package',
        package: { packageRef: target._id, startDate: '2026-01-10', travelerSlots: 2 },
        pricing: { basePrice: target.price * 2, taxes: 60, fees: 20, discount: 0, total: target.price * 2 + 80, currency: 'USD' },
      };
    }

    const booking = await Booking.create({
      user: user._id,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      contactEmail: user.email,
      travelers: [{ firstName: user.name.split(' ')[0], lastName: user.name.split(' ')[1] || '', type: 'adult' }],
      ...bookingPayload,
    });

    await Review.create({
      user: user._id,
      booking: booking._id,
      targetType: r.targetType,
      [r.targetType]: target._id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isModerated: true,
    });

    booking.reviewedAt = new Date();
    await booking.save();

    // Roll the review into the target's aggregate rating.
    const Model = r.targetType === 'hotel' ? Hotel : TravelPackage;
    const agg = await Review.aggregate([
      { $match: { [r.targetType]: target._id, isHidden: false } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (agg[0]) {
      await Model.findByIdAndUpdate(target._id, {
        ratingAverage: Math.round(agg[0].avg * 10) / 10,
        ratingCount: agg[0].count,
      });
    }
  }

  logger.info('Seed complete.');
  logger.info('─────────────────────────────────────────');
  logger.info('Dev admin login → admin@aerlume.dev / DevAdmin#2026');
  logger.info('Dev user login  → amara.chen@example.com / DevUser#2026');
  logger.info('(Development credentials only — never use these in production.)');
  logger.info('─────────────────────────────────────────');

  await disconnectDB();
  process.exit(0);
};

seed().catch((err) => {
  logger.error(`Seeding failed: ${err.message}`, { stack: err.stack });
  mongoose.connection.close();
  process.exit(1);
});
