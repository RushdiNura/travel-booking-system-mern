import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aiPlannerProvider } from '../services/providers/AIPlannerProvider.js';

export const getPlannerStatus = asyncHandler(async (_req, res) => {
  return new ApiResponse(200, { configured: aiPlannerProvider.isConfigured() }).send(res);
});

export const generateTripPlan = asyncHandler(async (req, res) => {
  const { destination, budget, durationDays, travelers, interests, travelStyle } = req.body;
  const plan = await aiPlannerProvider.generatePlan({ destination, budget, durationDays, travelers, interests, travelStyle });
  return new ApiResponse(200, plan, 'Trip plan generated').send(res);
});
