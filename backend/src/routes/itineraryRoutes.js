import { Router } from 'express';
import * as itineraryController from '../controllers/itineraryController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createItineraryRules,
  updateItineraryRules,
  addItemRules,
  updateItemRules,
} from '../validators/itineraryValidators.js';

const router = Router();
router.use(protect);

router.get('/', itineraryController.listMyItineraries);
router.post('/', createItineraryRules, validate, itineraryController.createItinerary);
router.get('/:id', itineraryController.getItinerary);
router.patch('/:id', updateItineraryRules, validate, itineraryController.updateItinerary);
router.delete('/:id', itineraryController.deleteItinerary);

router.post('/:id/items', addItemRules, validate, itineraryController.addItem);
router.patch('/:id/items/:itemId', updateItemRules, validate, itineraryController.updateItem);
router.delete('/:id/items/:itemId', updateItemRules, validate, itineraryController.deleteItem);

export default router;
