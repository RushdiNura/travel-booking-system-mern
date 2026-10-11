import { User } from '../models/User.js';
import { Destination } from '../models/Destination.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listSavedDestinations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedDestinations');
  return new ApiResponse(200, user.savedDestinations).send(res);
});

export const saveDestination = asyncHandler(async (req, res) => {
  const destination = await Destination.findById(req.params.destinationId);
  if (!destination) throw ApiError.notFound('Destination not found');

  await User.updateOne({ _id: req.user._id }, { $addToSet: { savedDestinations: destination._id } });
  return new ApiResponse(200, null, 'Destination saved').send(res);
});

export const unsaveDestination = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { savedDestinations: req.params.destinationId } });
  return new ApiResponse(200, null, 'Destination removed from saved list').send(res);
});
