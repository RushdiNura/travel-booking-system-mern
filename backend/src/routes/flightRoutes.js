import { Router } from 'express';
import * as flightController from '../controllers/flightController.js';
import { validate } from '../middleware/validate.js';
import { searchFlightsRules, flightIdParamRules } from '../validators/flightValidators.js';

const router = Router();

router.get('/', searchFlightsRules, validate, flightController.searchFlights);
router.get('/airports', flightController.listAirports);
router.get('/:id', flightIdParamRules, validate, flightController.getFlightById);

export default router;
