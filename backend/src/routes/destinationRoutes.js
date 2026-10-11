import { Router } from 'express';
import * as destinationController from '../controllers/destinationController.js';

const router = Router();

router.get('/', destinationController.listDestinations);
router.get('/:slug', destinationController.getDestinationBySlug);
router.get('/:slug/weather', destinationController.getDestinationWeather);

export default router;
