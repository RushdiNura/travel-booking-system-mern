import { Itinerary } from '../models/Itinerary.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function loadOwnedItinerary(id, userId) {
  const itinerary = await Itinerary.findById(id);
  if (!itinerary) throw ApiError.notFound('Itinerary not found');
  if (itinerary.user.toString() !== userId.toString()) {
    throw ApiError.notFound('Itinerary not found'); // don't reveal existence to non-owners
  }
  return itinerary;
}

export const listMyItineraries = asyncHandler(async (req, res) => {
  const itineraries = await Itinerary.find({ user: req.user._id })
    .populate('destination', 'name slug country')
    .sort({ createdAt: -1 })
    .lean();
  return new ApiResponse(200, itineraries).send(res);
});

export const createItinerary = asyncHandler(async (req, res) => {
  const { title, destination, startDate, endDate } = req.body;
  const itinerary = await Itinerary.create({ user: req.user._id, title, destination, startDate, endDate, items: [] });
  return new ApiResponse(201, itinerary, 'Itinerary created').send(res);
});

export const getItinerary = asyncHandler(async (req, res) => {
  const itinerary = await loadOwnedItinerary(req.params.id, req.user._id);
  await itinerary.populate('destination', 'name slug country coordinates');
  return new ApiResponse(200, itinerary).send(res);
});

export const updateItinerary = asyncHandler(async (req, res) => {
  const itinerary = await loadOwnedItinerary(req.params.id, req.user._id);
  const { title, destination, startDate, endDate } = req.body;
  if (title !== undefined) itinerary.title = title;
  if (destination !== undefined) itinerary.destination = destination;
  if (startDate !== undefined) itinerary.startDate = startDate;
  if (endDate !== undefined) itinerary.endDate = endDate;
  await itinerary.save();
  return new ApiResponse(200, itinerary, 'Itinerary updated').send(res);
});

export const deleteItinerary = asyncHandler(async (req, res) => {
  const itinerary = await loadOwnedItinerary(req.params.id, req.user._id);
  await itinerary.deleteOne();
  return new ApiResponse(200, null, 'Itinerary deleted').send(res);
});

export const addItem = asyncHandler(async (req, res) => {
  const itinerary = await loadOwnedItinerary(req.params.id, req.user._id);
  const { day, time, type, title, description, location, linkedBooking } = req.body;

  const order = itinerary.items.filter((i) => i.day === day).length;
  itinerary.items.push({ day, time, type, title, description, location, linkedBooking, order });
  await itinerary.save();

  return new ApiResponse(201, itinerary, 'Item added').send(res);
});

export const updateItem = asyncHandler(async (req, res) => {
  const itinerary = await loadOwnedItinerary(req.params.id, req.user._id);
  const item = itinerary.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Itinerary item not found');

  const { day, time, type, title, description, location, order } = req.body;
  if (day !== undefined) item.day = day;
  if (time !== undefined) item.time = time;
  if (type !== undefined) item.type = type;
  if (title !== undefined) item.title = title;
  if (description !== undefined) item.description = description;
  if (location !== undefined) item.location = location;
  if (order !== undefined) item.order = order;

  await itinerary.save();
  return new ApiResponse(200, itinerary, 'Item updated').send(res);
});

export const deleteItem = asyncHandler(async (req, res) => {
  const itinerary = await loadOwnedItinerary(req.params.id, req.user._id);
  const item = itinerary.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Itinerary item not found');
  item.deleteOne();
  await itinerary.save();
  return new ApiResponse(200, itinerary, 'Item removed').send(res);
});
