import { Router } from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { loadBooking } from '../middleware/loadBooking.js';
import { validate } from '../middleware/validate.js';
import { createBookingRules, bookingIdParamRules, cancelBookingRules } from '../validators/bookingValidators.js';

const router = Router();

router.use(protect); // every booking route requires authentication

router.post('/', createBookingRules, validate, bookingController.createBooking);
router.get('/', bookingController.listMyBookings);
router.get('/admin/all', requireRole('admin'), bookingController.listAllBookings);
router.get('/:id', bookingIdParamRules, validate, loadBooking, bookingController.getBookingById);
router.get('/:id/confirmation-pdf', bookingIdParamRules, validate, loadBooking, bookingController.downloadConfirmationPdf);
router.post('/:id/cancel', cancelBookingRules, validate, bookingController.cancelBooking);

export default router;
