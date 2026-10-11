import { Router } from 'express';
import { param } from 'express-validator';
import * as userController from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

const destinationIdRules = [param('destinationId').isMongoId().withMessage('Invalid destination id')];

router.get('/me/saved-destinations', userController.listSavedDestinations);
router.post('/me/saved-destinations/:destinationId', destinationIdRules, validate, userController.saveDestination);
router.delete('/me/saved-destinations/:destinationId', destinationIdRules, validate, userController.unsaveDestination);

export default router;
