import { Flight } from '../models/Flight.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Full flight search with server-side filtering, sorting, and pagination.
 * Deliberately queries Mongo directly (rather than the FlightProvider
 * abstraction's simpler `search`) so cabin-specific price/seat filters and
 * client-adjustable sort/pagination can all be pushed down to the DB —
 * the important thing is that filtering never happens by loading
 * everything into memory in Node.
 */
export const searchFlights = asyncHandler(async (req, res) => {
  const {
    origin,
    destination,
    departureDate,
    cabin = 'economy',
    travelers = 1,
    page = 1,
    limit = 10,
    sort = 'recommended',
    minPrice,
    maxPrice,
    airline,
    maxStops,
  } = req.query;

  const match = { isActive: true, status: { $ne: 'cancelled' } };
  if (origin) match['origin.code'] = origin.toUpperCase();
  if (destination) match['destination.code'] = destination.toUpperCase();
  if (departureDate) {
    const start = new Date(`${departureDate}T00:00:00.000Z`);
    const end = new Date(`${departureDate}T23:59:59.999Z`);
    match.departureTime = { $gte: start, $lte: end };
  }
  if (airline) match['airline.name'] = new RegExp(airline, 'i');
  if (maxStops !== undefined) match.stops = { $lte: Number(maxStops) };

  // Only flights that actually have the requested cabin with enough seats.
  match.cabinClasses = {
    $elemMatch: {
      cabin,
      availableSeats: { $gte: Number(travelers) },
      ...(minPrice || maxPrice
        ? {
            price: {
              ...(minPrice ? { $gte: Number(minPrice) } : {}),
              ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
            },
          }
        : {}),
    },
  };

  const sortMap = {
    cheapest: { 'cabinClasses.0.price': 1 },
    fastest: { durationMinutes: 1 },
    departure: { departureTime: 1 },
    recommended: { stops: 1, departureTime: 1 },
  };

  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    Flight.find(match).sort(sortMap[sort] || sortMap.recommended).skip(skip).limit(limit).lean(),
    Flight.countDocuments(match),
  ]);

  // Shape the response to the requested cabin so the frontend doesn't
  // have to know about the full cabinClasses array.
  const shaped = results.map((f) => {
    const selectedCabin = f.cabinClasses.find((c) => c.cabin === cabin);
    return { ...f, selectedCabin };
  });

  return new ApiResponse(200, shaped, 'Flights retrieved', {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

export const getFlightById = asyncHandler(async (req, res) => {
  const flight = await Flight.findById(req.params.id).lean();
  if (!flight) throw ApiError.notFound('Flight not found');
  return new ApiResponse(200, flight).send(res);
});

// Distinct airport list for search-box autocomplete — small, cacheable query.
export const listAirports = asyncHandler(async (_req, res) => {
  const origins = await Flight.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$origin.code', city: { $first: '$origin.city' }, name: { $first: '$origin.name' }, country: { $first: '$origin.country' } } },
    { $project: { _id: 0, code: '$_id', city: 1, name: 1, country: 1 } },
    { $sort: { city: 1 } },
  ]);
  return new ApiResponse(200, origins).send(res);
});
