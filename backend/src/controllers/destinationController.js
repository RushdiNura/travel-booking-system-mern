import { Destination } from '../models/Destination.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { weatherProvider } from '../services/providers/WeatherProvider.js';

export const listDestinations = asyncHandler(async (req, res) => {
  const { featured, search, page = 1, limit = 20 } = req.query;
  const match = {};
  if (featured !== undefined) match.isFeatured = featured === 'true';
  if (search) match.$text = { $search: search };

  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    Destination.find(match)
      .sort(search ? { score: { $meta: 'textScore' } } : { popularityScore: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Destination.countDocuments(match),
  ]);

  return new ApiResponse(200, results, 'Destinations retrieved', {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

export const getDestinationBySlug = asyncHandler(async (req, res) => {
  const destination = await Destination.findOne({ slug: req.params.slug }).lean();
  if (!destination) throw ApiError.notFound('Destination not found');
  return new ApiResponse(200, destination).send(res);
});

export const getDestinationWeather = asyncHandler(async (req, res) => {
  const destination = await Destination.findOne({ slug: req.params.slug }).lean();
  if (!destination) throw ApiError.notFound('Destination not found');

  const forecast = await weatherProvider.getForecast(destination.coordinates);
  return new ApiResponse(200, forecast).send(res);
});
