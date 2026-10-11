import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as bookingService from '../services/bookingService.js';
import * as paymentService from '../services/paymentService.js';
import * as notificationService from '../services/notificationService.js';
import { streamBookingConfirmationPDF } from '../services/pdfService.js';

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user, req.body);
  return new ApiResponse(
    201,
    { booking },
    'Booking held. Complete payment before the hold expires to confirm it.'
  ).send(res);
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const match = { user: req.user._id };
  if (status) match.status = status;

  const skip = (page - 1) * Number(limit);
  const [results, total] = await Promise.all([
    Booking.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('flight.flightRef', 'airline flightNumber origin destination departureTime arrivalTime')
      .populate('hotel.hotelRef', 'name images address')
      .populate('package.packageRef', 'title images destination')
      .lean(),
    Booking.countDocuments(match),
  ]);

  return new ApiResponse(200, results, 'Bookings retrieved', {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

// Admin: search/filter across all bookings.
export const listAllBookings = asyncHandler(async (req, res) => {
  const { status, paymentStatus, bookingType, page = 1, limit = 20 } = req.query;
  const match = {};
  if (status) match.status = status;
  if (paymentStatus) match.paymentStatus = paymentStatus;
  if (bookingType) match.bookingType = bookingType;

  const skip = (page - 1) * Number(limit);
  const [results, total] = await Promise.all([
    Booking.find(match).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('user', 'name email').lean(),
    Booking.countDocuments(match),
  ]);

  return new ApiResponse(200, results, 'Bookings retrieved', {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

export const getBookingById = asyncHandler(async (req, res) => {
  // req.booking was already loaded + ownership-checked by loadBooking middleware.
  const booking = await req.booking.populate([
    { path: 'flight.flightRef', select: 'airline flightNumber origin destination departureTime arrivalTime durationMinutes' },
    { path: 'flight.returnFlightRef', select: 'airline flightNumber origin destination departureTime arrivalTime durationMinutes' },
    { path: 'hotel.hotelRef', select: 'name images address coordinates' },
    { path: 'hotel.roomTypeRef', select: 'name capacity beds' },
    { path: 'package.packageRef', select: 'title images destination durationDays durationNights' },
  ]);
  return new ApiResponse(200, booking).send(res);
});

export const cancelBooking = asyncHandler(async (req, res) => {
  let booking = await bookingService.cancelBooking(req.params.id, req.user, req.body.reason);

  await notificationService.notifyBookingCancelled(booking);

  // Only bookings that were actually paid land in REFUND_PENDING; unpaid
  // holds are just released, with nothing to refund.
  if (booking.cancellation.status === 'REFUND_PENDING') {
    booking = await paymentService.refundBookingPayment(booking);
  }

  return new ApiResponse(200, booking, 'Booking cancelled').send(res);
});

export const downloadConfirmationPdf = asyncHandler(async (req, res) => {
  // req.booking was already loaded + ownership-checked by loadBooking middleware.
  if (!['CONFIRMED', 'COMPLETED'].includes(req.booking.status)) {
    throw ApiError.conflict('A confirmation PDF is only available for confirmed bookings');
  }

  const booking = await req.booking.populate([
    { path: 'flight.flightRef', select: 'airline flightNumber origin destination departureTime arrivalTime' },
    { path: 'hotel.hotelRef', select: 'name address' },
    { path: 'package.packageRef', select: 'title' },
  ]);

  streamBookingConfirmationPDF(booking, res);
});
