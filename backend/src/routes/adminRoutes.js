import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

import * as adminController from '../controllers/adminController.js';
import * as inventoryController from '../controllers/adminInventoryController.js';
import * as analyticsController from '../controllers/adminAnalyticsController.js';
import * as reviewController from '../controllers/reviewController.js';

import {
  userStatusRules,
  userRoleRules,
  mongoIdParamRules,
  hotelIdParamRules,
  flightWriteRules,
  hotelWriteRules,
} from '../validators/adminValidators.js';
import { moderateReviewRules } from '../validators/reviewValidators.js';

const router = Router();

router.use(protect, requireRole('admin'));

// Overview
router.get('/overview', adminController.getOverview);

// Users
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', userStatusRules, validate, adminController.updateUserStatus);
router.patch('/users/:id/role', userRoleRules, validate, adminController.updateUserRole);

// Flights
router.get('/flights', inventoryController.listFlightsAdmin);
router.post('/flights', flightWriteRules, validate, inventoryController.createFlight);
router.patch('/flights/:id', mongoIdParamRules, flightWriteRules, validate, inventoryController.updateFlight);
router.post('/flights/:id/deactivate', mongoIdParamRules, validate, inventoryController.deactivateFlight);
router.delete('/flights/:id', mongoIdParamRules, validate, inventoryController.deleteFlight);

// Hotels + room types
router.get('/hotels', inventoryController.listHotelsAdmin);
router.post('/hotels', hotelWriteRules, validate, inventoryController.createHotel);
router.patch('/hotels/:id', mongoIdParamRules, hotelWriteRules, validate, inventoryController.updateHotel);
router.post('/hotels/:id/deactivate', mongoIdParamRules, validate, inventoryController.deactivateHotel);
router.post('/hotels/:hotelId/rooms', hotelIdParamRules, validate, inventoryController.createRoomType);
router.patch('/rooms/:id', mongoIdParamRules, validate, inventoryController.updateRoomType);
router.post('/rooms/:id/deactivate', mongoIdParamRules, validate, inventoryController.deactivateRoomType);

// Packages
router.get('/packages', inventoryController.listPackagesAdmin);
router.post('/packages', inventoryController.createPackage);
router.patch('/packages/:id', mongoIdParamRules, validate, inventoryController.updatePackage);
router.post('/packages/:id/deactivate', mongoIdParamRules, validate, inventoryController.deactivatePackage);

// Analytics
router.get('/analytics/revenue', analyticsController.getRevenueOverTime);
router.get('/analytics/bookings-over-time', analyticsController.getBookingsOverTime);
router.get('/analytics/popular-destinations', analyticsController.getPopularDestinations);
router.get('/analytics/cancellation-rate', analyticsController.getCancellationRate);

// Review moderation
router.patch('/reviews/:id/moderate', moderateReviewRules, validate, reviewController.moderateReview);

export default router;
