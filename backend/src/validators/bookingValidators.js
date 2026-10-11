import { body, param } from 'express-validator';

const travelerRules = body('travelers')
  .isArray({ min: 1 })
  .withMessage('At least one traveler is required')
  .custom((travelers) => {
    for (const t of travelers) {
      if (!t.firstName || !t.lastName) {
        throw new Error('Each traveler needs a first and last name');
      }
    }
    return true;
  });

export const createBookingRules = [
  body('bookingType').isIn(['flight', 'hotel', 'package']).withMessage('Invalid booking type'),
  body('contactEmail').isEmail().withMessage('A valid contact email is required'),
  body('contactPhone').optional().trim(),
  body('specialRequests').optional().trim().isLength({ max: 500 }),
  body('couponCode').optional().trim().toUpperCase(),
  travelerRules,

  // Flight-specific
  body('flightId').if(body('bookingType').equals('flight')).isMongoId().withMessage('Valid flightId is required'),
  body('cabin')
    .if(body('bookingType').equals('flight'))
    .isIn(['economy', 'premium_economy', 'business', 'first'])
    .withMessage('Valid cabin class is required'),
  body('tripType').if(body('bookingType').equals('flight')).optional().isIn(['one_way', 'round_trip']),
  body('returnFlightId').if(body('tripType').equals('round_trip')).isMongoId().withMessage('returnFlightId is required for round trips'),

  // Hotel-specific
  body('hotelId').if(body('bookingType').equals('hotel')).isMongoId().withMessage('Valid hotelId is required'),
  body('roomTypeId').if(body('bookingType').equals('hotel')).isMongoId().withMessage('Valid roomTypeId is required'),
  body('checkIn').if(body('bookingType').equals('hotel')).isISO8601().withMessage('Valid checkIn date is required'),
  body('checkOut').if(body('bookingType').equals('hotel')).isISO8601().withMessage('Valid checkOut date is required'),
  body('rooms').if(body('bookingType').equals('hotel')).optional().isInt({ min: 1, max: 10 }).toInt(),

  // Package-specific
  body('packageId').if(body('bookingType').equals('package')).isMongoId().withMessage('Valid packageId is required'),
  body('departureDateId').if(body('bookingType').equals('package')).isMongoId().withMessage('Valid departureDateId is required'),
  body('travelerSlots').if(body('bookingType').equals('package')).optional().isInt({ min: 1 }).toInt(),
];

export const bookingIdParamRules = [param('id').isMongoId().withMessage('Invalid booking id')];

export const cancelBookingRules = [
  param('id').isMongoId().withMessage('Invalid booking id'),
  body('reason').optional().trim().isLength({ max: 500 }),
];
