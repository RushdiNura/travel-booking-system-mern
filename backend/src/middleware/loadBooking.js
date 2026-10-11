import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Loads the booking named by req.params.id and attaches it as req.booking,
 * so ownership middleware (requireOwnerOrAdmin) has something synchronous
 * to check. 404s before any authorization decision leaks whether a
 * booking id exists to a non-owner.
 */
export const loadBooking = asyncHandler(async (req, _res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');

  const isOwner = booking.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.notFound('Booking not found'); // 404, not 403 — don't confirm existence to non-owners
  }

  req.booking = booking;
  next();
});
