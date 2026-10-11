import { Booking } from '../models/Booking.js';
import { Destination } from '../models/Destination.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const PAID_STATUSES = ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'];

export const getRevenueOverTime = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

  const results = await Booking.aggregate([
    { $match: { paymentStatus: { $in: PAID_STATUSES }, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$pricing.total' },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', revenue: 1, bookings: 1 } },
  ]);

  return new ApiResponse(200, results).send(res);
});

export const getBookingsOverTime = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

  const results = await Booking.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: 1 },
        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', total: 1, confirmed: 1, cancelled: 1 } },
  ]);

  return new ApiResponse(200, results).send(res);
});

export const getPopularDestinations = asyncHandler(async (_req, res) => {
  // Popularity derived from confirmed/completed hotel and package bookings,
  // joined back to their destination — a real signal, not a static list.
  const hotelDestinations = await Booking.aggregate([
    { $match: { bookingType: 'hotel', status: { $in: ['CONFIRMED', 'COMPLETED'] } } },
    { $lookup: { from: 'hotels', localField: 'hotel.hotelRef', foreignField: '_id', as: 'hotelDoc' } },
    { $unwind: '$hotelDoc' },
    { $group: { _id: '$hotelDoc.destination', count: { $sum: 1 } } },
  ]);

  const packageDestinations = await Booking.aggregate([
    { $match: { bookingType: 'package', status: { $in: ['CONFIRMED', 'COMPLETED'] } } },
    { $lookup: { from: 'travelpackages', localField: 'package.packageRef', foreignField: '_id', as: 'pkgDoc' } },
    { $unwind: '$pkgDoc' },
    { $group: { _id: '$pkgDoc.destination', count: { $sum: 1 } } },
  ]);

  const merged = new Map();
  for (const entry of [...hotelDestinations, ...packageDestinations]) {
    const key = entry._id.toString();
    merged.set(key, (merged.get(key) || 0) + entry.count);
  }

  const destinationIds = [...merged.keys()];
  const destinations = await Destination.find({ _id: { $in: destinationIds } }).select('name country slug').lean();

  const results = destinations
    .map((d) => ({ ...d, bookingCount: merged.get(d._id.toString()) || 0 }))
    .sort((a, b) => b.bookingCount - a.bookingCount);

  return new ApiResponse(200, results).send(res);
});

export const getCancellationRate = asyncHandler(async (_req, res) => {
  const [total, cancelled] = await Promise.all([
    Booking.countDocuments({ status: { $in: ['CONFIRMED', 'CANCELLED', 'COMPLETED'] } }),
    Booking.countDocuments({ status: 'CANCELLED' }),
  ]);
  const rate = total > 0 ? Math.round((cancelled / total) * 1000) / 10 : 0;

  const avgAgg = await Booking.aggregate([
    { $match: { paymentStatus: { $in: PAID_STATUSES } } },
    { $group: { _id: null, avg: { $avg: '$pricing.total' } } },
  ]);

  return new ApiResponse(200, {
    totalBookings: total,
    cancelledBookings: cancelled,
    cancellationRatePercent: rate,
    averageBookingValue: Math.round((avgAgg[0]?.avg || 0) * 100) / 100,
  }).send(res);
});
