import { Router } from 'express';
import authRoutes from './authRoutes.js';
import healthRoutes from './healthRoutes.js';
import flightRoutes from './flightRoutes.js';
import hotelRoutes from './hotelRoutes.js';
import packageRoutes from './packageRoutes.js';
import destinationRoutes from './destinationRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import userRoutes from './userRoutes.js';
import adminRoutes from './adminRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import itineraryRoutes from './itineraryRoutes.js';
import currencyRoutes from './currencyRoutes.js';
import aiRoutes from './aiRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/flights', flightRoutes);
router.use('/hotels', hotelRoutes);
router.use('/packages', packageRoutes);
router.use('/destinations', destinationRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/itineraries', itineraryRoutes);
router.use('/currency', currencyRoutes);
router.use('/ai', aiRoutes);

export default router;
