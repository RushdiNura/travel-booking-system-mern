import { Hotel } from '../models/Hotel.js';
import { RoomType } from '../models/RoomType.js';
import { Destination } from '../models/Destination.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getStayNights } from '../utils/dateRange.js';

export const searchHotels = asyncHandler(async (req, res) => {
  const {
    destination,
    city,
    checkIn,
    checkOut,
    rooms = 1,
    minPrice,
    maxPrice,
    starRating,
    breakfastIncluded,
    freeCancellation,
    page = 1,
    limit = 12,
    sort = 'recommended',
  } = req.query;

  const match = { isActive: true };
  if (city) match['address.city'] = new RegExp(city, 'i');
  if (starRating) match.starRating = { $gte: Number(starRating) };
  if (breakfastIncluded !== undefined) match.breakfastIncluded = breakfastIncluded;
  if (freeCancellation !== undefined) match.freeCancellation = freeCancellation;

  if (destination) {
    const dest = await Destination.findOne({
      $or: [{ slug: destination }, { name: new RegExp(`^${destination}$`, 'i') }],
    }).lean();
    if (dest) match.destination = dest._id;
    else match['address.city'] = new RegExp(destination, 'i'); // fallback: free-text city match
  }

  const sortMap = {
    rating: { ratingAverage: -1 },
    recommended: { isFeatured: -1, ratingAverage: -1 },
  };

  // Fetch a candidate set, then filter/sort by price and availability,
  // which live on RoomType rather than Hotel.
  let hotels = await Hotel.find(match)
    .populate('destination', 'name slug country')
    .sort(sortMap[sort] || sortMap.recommended)
    .lean();

  const hotelIds = hotels.map((h) => h._id);
  const roomTypes = await RoomType.find({ hotel: { $in: hotelIds }, isActive: true }).lean();
  const roomsByHotel = new Map();
  for (const rt of roomTypes) {
    const key = rt.hotel.toString();
    if (!roomsByHotel.has(key)) roomsByHotel.set(key, []);
    roomsByHotel.get(key).push(rt);
  }

  const nights = checkIn && checkOut ? getStayNights(checkIn, checkOut) : null;

  hotels = hotels
    .map((h) => {
      const hotelRooms = roomsByHotel.get(h._id.toString()) || [];
      let cheapestPrice = hotelRooms.length ? Math.min(...hotelRooms.map((r) => r.basePrice)) : null;

      let hasAvailability = true;
      if (nights) {
        // A hotel "has availability" for the search if at least one room
        // type can cover the requested room count across every night.
        hasAvailability = hotelRooms.some((rt) => {
          return nights.every((dateStr) => {
            const entry = rt.nights?.find((n) => n.date === dateStr);
            const available = entry ? entry.total - entry.held - entry.booked : rt.defaultQuantity;
            return available >= Number(rooms);
          });
        });
      }

      return { ...h, fromPrice: cheapestPrice, hasAvailability };
    })
    .filter((h) => h.fromPrice != null)
    .filter((h) => (nights ? h.hasAvailability : true))
    .filter((h) => (minPrice ? h.fromPrice >= Number(minPrice) : true))
    .filter((h) => (maxPrice ? h.fromPrice <= Number(maxPrice) : true));

  if (sort === 'price') hotels.sort((a, b) => a.fromPrice - b.fromPrice);

  const total = hotels.length;
  const start = (page - 1) * limit;
  const paged = hotels.slice(start, start + Number(limit));

  return new ApiResponse(200, paged, 'Hotels retrieved', {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

export const getHotelById = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id).populate('destination', 'name slug country coordinates').lean();
  if (!hotel) throw ApiError.notFound('Hotel not found');

  const roomTypes = await RoomType.find({ hotel: hotel._id, isActive: true }).lean();

  return new ApiResponse(200, { ...hotel, roomTypes }).send(res);
});

/**
 * Returns each room type's availability for the specific requested stay,
 * so the frontend can show "3 rooms left" (or disable booking) before the
 * user reaches checkout — while the booking endpoint (Phase 3) remains
 * the sole source of truth via atomic holds.
 */
export const getRoomAvailability = asyncHandler(async (req, res) => {
  const { checkIn, checkOut, rooms = 1 } = req.query;
  const nights = getStayNights(checkIn, checkOut);
  if (nights.length === 0) {
    throw ApiError.badRequest('checkOut must be after checkIn');
  }

  const roomTypes = await RoomType.find({ hotel: req.params.id, isActive: true });
  if (!roomTypes.length) throw ApiError.notFound('No room types found for this hotel');

  const result = roomTypes.map((rt) => {
    const nightly = nights.map((dateStr) => rt.getNightAvailability(dateStr));
    const minAvailable = Math.min(...nightly.map((n) => n.available));
    return {
      roomTypeId: rt._id,
      name: rt.name,
      basePrice: rt.basePrice,
      currency: rt.currency,
      capacity: rt.capacity,
      nights: nightly,
      minAvailableAcrossStay: minAvailable,
      canBook: minAvailable >= Number(rooms),
      totalPriceEstimate: rt.basePrice * nights.length * Number(rooms),
    };
  });

  return new ApiResponse(200, result, 'Availability retrieved').send(res);
});
