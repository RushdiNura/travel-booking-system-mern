import { Router } from 'express';
import * as hotelController from '../controllers/hotelController.js';
import { validate } from '../middleware/validate.js';
import { searchHotelsRules, hotelIdParamRules, roomAvailabilityRules } from '../validators/hotelValidators.js';

const router = Router();

router.get('/', searchHotelsRules, validate, hotelController.searchHotels);
router.get('/:id', hotelIdParamRules, validate, hotelController.getHotelById);
router.get('/:id/availability', roomAvailabilityRules, validate, hotelController.getRoomAvailability);

export default router;
