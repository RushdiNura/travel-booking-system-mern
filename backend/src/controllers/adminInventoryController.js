import { Flight } from '../models/Flight.js';
import { Hotel } from '../models/Hotel.js';
import { RoomType } from '../models/RoomType.js';
import { TravelPackage } from '../models/TravelPackage.js';
import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/* ── Flights ────────────────────────────────────────────────────────── */

export const listFlightsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const match = {};
  if (status) match.status = status;
  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    Flight.find(match).sort({ departureTime: -1 }).skip(skip).limit(Number(limit)).lean(),
    Flight.countDocuments(match),
  ]);
  return new ApiResponse(200, results, 'Flights retrieved', {
    page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit),
  }).send(res);
});

export const createFlight = asyncHandler(async (req, res) => {
  const flight = await Flight.create(req.body);
  return new ApiResponse(201, flight, 'Flight created').send(res);
});

export const updateFlight = asyncHandler(async (req, res) => {
  const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!flight) throw ApiError.notFound('Flight not found');
  return new ApiResponse(200, flight, 'Flight updated').send(res);
});

export const deactivateFlight = asyncHandler(async (req, res) => {
  const flight = await Flight.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!flight) throw ApiError.notFound('Flight not found');
  return new ApiResponse(200, flight, 'Flight deactivated').send(res);
});

export const deleteFlight = asyncHandler(async (req, res) => {
  const hasBookings = await Booking.exists({ 'flight.flightRef': req.params.id, status: { $ne: 'CANCELLED' } });
  if (hasBookings) {
    throw ApiError.conflict('This flight has active bookings and cannot be deleted — deactivate it instead');
  }
  const flight = await Flight.findByIdAndDelete(req.params.id);
  if (!flight) throw ApiError.notFound('Flight not found');
  return new ApiResponse(200, null, 'Flight deleted').send(res);
});

/* ── Hotels ─────────────────────────────────────────────────────────── */

export const listHotelsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    Hotel.find({}).populate('destination', 'name country').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Hotel.countDocuments({}),
  ]);
  return new ApiResponse(200, results, 'Hotels retrieved', {
    page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit),
  }).send(res);
});

export const createHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.create(req.body);
  return new ApiResponse(201, hotel, 'Hotel created').send(res);
});

export const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!hotel) throw ApiError.notFound('Hotel not found');
  return new ApiResponse(200, hotel, 'Hotel updated').send(res);
});

export const deactivateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!hotel) throw ApiError.notFound('Hotel not found');
  return new ApiResponse(200, hotel, 'Hotel deactivated').send(res);
});

// Room types
export const createRoomType = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.hotelId);
  if (!hotel) throw ApiError.notFound('Hotel not found');
  const roomType = await RoomType.create({ ...req.body, hotel: hotel._id });
  return new ApiResponse(201, roomType, 'Room type created').send(res);
});

export const updateRoomType = asyncHandler(async (req, res) => {
  const roomType = await RoomType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!roomType) throw ApiError.notFound('Room type not found');
  return new ApiResponse(200, roomType, 'Room type updated').send(res);
});

export const deactivateRoomType = asyncHandler(async (req, res) => {
  const roomType = await RoomType.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!roomType) throw ApiError.notFound('Room type not found');
  return new ApiResponse(200, roomType, 'Room type deactivated').send(res);
});

/* ── Packages ───────────────────────────────────────────────────────── */

export const listPackagesAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    TravelPackage.find({}).populate('destination', 'name country').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    TravelPackage.countDocuments({}),
  ]);
  return new ApiResponse(200, results, 'Packages retrieved', {
    page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit),
  }).send(res);
});

export const createPackage = asyncHandler(async (req, res) => {
  const pkg = await TravelPackage.create(req.body);
  return new ApiResponse(201, pkg, 'Package created').send(res);
});

export const updatePackage = asyncHandler(async (req, res) => {
  const pkg = await TravelPackage.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!pkg) throw ApiError.notFound('Package not found');
  return new ApiResponse(200, pkg, 'Package updated').send(res);
});

export const deactivatePackage = asyncHandler(async (req, res) => {
  const pkg = await TravelPackage.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!pkg) throw ApiError.notFound('Package not found');
  return new ApiResponse(200, pkg, 'Package deactivated').send(res);
});
