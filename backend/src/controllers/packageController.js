import { TravelPackage } from '../models/TravelPackage.js';
import { Destination } from '../models/Destination.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const searchPackages = asyncHandler(async (req, res) => {
  const {
    destination,
    minPrice,
    maxPrice,
    minDuration,
    maxDuration,
    page = 1,
    limit = 12,
    sort = 'recommended',
  } = req.query;

  const match = { isActive: true };

  if (destination) {
    const dest = await Destination.findOne({
      $or: [{ slug: destination }, { name: new RegExp(`^${destination}$`, 'i') }],
    }).lean();
    if (dest) match.destination = dest._id;
  }
  if (minPrice || maxPrice) {
    match.price = {};
    if (minPrice) match.price.$gte = Number(minPrice);
    if (maxPrice) match.price.$lte = Number(maxPrice);
  }
  if (minDuration || maxDuration) {
    match.durationDays = {};
    if (minDuration) match.durationDays.$gte = Number(minDuration);
    if (maxDuration) match.durationDays.$lte = Number(maxDuration);
  }

  const sortMap = {
    price: { price: 1 },
    rating: { ratingAverage: -1 },
    recommended: { isFeatured: -1, ratingAverage: -1 },
  };

  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    TravelPackage.find(match)
      .populate('destination', 'name slug country')
      .sort(sortMap[sort] || sortMap.recommended)
      .skip(skip)
      .limit(limit)
      .select('-itinerary') // itinerary is heavy; fetched on the detail page only
      .lean(),
    TravelPackage.countDocuments(match),
  ]);

  return new ApiResponse(200, results, 'Packages retrieved', {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

export const getPackageById = asyncHandler(async (req, res) => {
  const pkg = await TravelPackage.findById(req.params.id)
    .populate('destination', 'name slug country coordinates')
    .populate('accommodation.hotel', 'name slug starRating images')
    .lean();
  if (!pkg) throw ApiError.notFound('Package not found');

  // Surface remaining slots per departure date rather than raw counters.
  const departureDates = (pkg.departureDates || []).map((d) => ({
    ...d,
    availableSlots: d.totalSlots - d.heldSlots - d.bookedSlots,
  }));

  return new ApiResponse(200, { ...pkg, departureDates }).send(res);
});
