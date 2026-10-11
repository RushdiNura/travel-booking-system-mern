import { Review } from '../models/Review.js';
import { Booking } from '../models/Booking.js';
import { Hotel } from '../models/Hotel.js';
import { TravelPackage } from '../models/TravelPackage.js';
import { Destination } from '../models/Destination.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const TARGET_MODEL = { hotel: Hotel, package: TravelPackage, destination: Destination };

export const listReviews = asyncHandler(async (req, res) => {
  const { targetType, targetId, page = 1, limit = 10 } = req.query;
  const match = { [targetType]: targetId, isHidden: false };

  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    Review.find(match).populate('user', 'name avatar').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Review.countDocuments(match),
  ]);

  return new ApiResponse(200, results, 'Reviews retrieved', {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

/**
 * Determines whether a destination is a valid review target for this
 * booking — a hotel booking's destination is its hotel's destination; a
 * package booking's destination is the package's own destination field.
 */
async function resolveBookingDestination(booking) {
  if (booking.bookingType === 'hotel') {
    const hotel = await Hotel.findById(booking.hotel.hotelRef).select('destination').lean();
    return hotel?.destination?.toString();
  }
  if (booking.bookingType === 'package') {
    const pkg = await TravelPackage.findById(booking.package.packageRef).select('destination').lean();
    return pkg?.destination?.toString();
  }
  return null; // flights aren't reviewable as destinations in this model
}

export const createReview = asyncHandler(async (req, res) => {
  const { bookingId, targetType, targetId, rating, title, comment } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only review your own bookings');
  }
  if (booking.status !== 'COMPLETED') {
    throw ApiError.badRequest('You can only review a booking after the trip is completed');
  }
  if (booking.reviewedAt) {
    throw ApiError.conflict('This booking has already been reviewed');
  }

  // Confirm the target actually matches something this booking covers —
  // stops a user from reviewing an unrelated hotel using any booking id.
  let isValidTarget = false;
  if (targetType === 'hotel' && booking.bookingType === 'hotel') {
    isValidTarget = booking.hotel.hotelRef.toString() === targetId;
  } else if (targetType === 'package' && booking.bookingType === 'package') {
    isValidTarget = booking.package.packageRef.toString() === targetId;
  } else if (targetType === 'destination') {
    const destId = await resolveBookingDestination(booking);
    isValidTarget = destId === targetId;
  }
  if (!isValidTarget) {
    throw ApiError.badRequest('This booking is not eligible to review the specified target');
  }

  const TargetModel = TARGET_MODEL[targetType];
  const target = await TargetModel.findById(targetId);
  if (!target) throw ApiError.notFound('Review target not found');

  let review;
  try {
    review = await Review.create({
      user: req.user._id,
      booking: booking._id,
      targetType,
      [targetType]: targetId,
      rating,
      title,
      comment,
      isModerated: true, // auto-approved; admin can still hide it later
    });
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('This booking has already been reviewed');
    throw err;
  }

  booking.reviewedAt = new Date();
  await booking.save();

  // Recompute the target's aggregate rating from visible reviews.
  const agg = await Review.aggregate([
    { $match: { [targetType]: target._id, isHidden: false } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (agg[0]) {
    await TargetModel.findByIdAndUpdate(target._id, {
      ratingAverage: Math.round(agg[0].avg * 10) / 10,
      ratingCount: agg[0].count,
    });
  }

  return new ApiResponse(201, review, 'Review submitted').send(res);
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only edit your own reviews');
  }

  const { rating, title, comment } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;
  await review.save();

  const TargetModel = TARGET_MODEL[review.targetType];
  const agg = await Review.aggregate([
    { $match: { [review.targetType]: review[review.targetType], isHidden: false } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (agg[0]) {
    await TargetModel.findByIdAndUpdate(review[review.targetType], {
      ratingAverage: Math.round(agg[0].avg * 10) / 10,
      ratingCount: agg[0].count,
    });
  }

  return new ApiResponse(200, review, 'Review updated').send(res);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own reviews');
  }

  const { targetType } = review;
  const targetId = review[targetType];
  await review.deleteOne();
  await Booking.updateOne({ _id: review.booking }, { $unset: { reviewedAt: 1 } });

  const TargetModel = TARGET_MODEL[targetType];
  const agg = await Review.aggregate([
    { $match: { [targetType]: targetId, isHidden: false } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await TargetModel.findByIdAndUpdate(targetId, {
    ratingAverage: agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0,
    ratingCount: agg[0]?.count || 0,
  });

  return new ApiResponse(200, null, 'Review deleted').send(res);
});

// Admin moderation
export const moderateReview = asyncHandler(async (req, res) => {
  const { isHidden, moderationNote } = req.body;
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  review.isHidden = isHidden;
  if (moderationNote !== undefined) review.moderationNote = moderationNote;
  await review.save();

  const TargetModel = TARGET_MODEL[review.targetType];
  const agg = await Review.aggregate([
    { $match: { [review.targetType]: review[review.targetType], isHidden: false } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await TargetModel.findByIdAndUpdate(review[review.targetType], {
    ratingAverage: agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0,
    ratingCount: agg[0]?.count || 0,
  });

  return new ApiResponse(200, review, 'Review moderation updated').send(res);
});
