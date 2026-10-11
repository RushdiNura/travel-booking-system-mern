import { Router } from 'express';
import * as aiController from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { aiPlannerLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { generatePlanRules } from '../validators/aiValidators.js';

const router = Router();

router.get('/status', aiController.getPlannerStatus);
router.post('/trip-plan', protect, aiPlannerLimiter, generatePlanRules, validate, aiController.generateTripPlan);

export default router;
