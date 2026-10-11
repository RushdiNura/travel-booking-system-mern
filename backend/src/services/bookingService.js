import { Booking } from '../models/Booking.js';
import { Flight } from '../models/Flight.js';
import { Hotel } from '../models/Hotel.js';
import { RoomType } from '../models/RoomType.js';
import { TravelPackage } from '../models/TravelPackage.js';
import { Coupon } from '../models/Coupon.js';
import { ApiError } from '../utils/ApiError.js';
import { withTransaction } from '../utils/transaction.js';
import { getStayNights } from '../utils/dateRange.js';
import { buildPricing, validateCoupon } from './pricingService.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import * as inventory from './inventoryService.js';

const HOLD_MS = () => env.bookingHoldMinutes * 60 * 1000;

/**
 * Creates a new booking hold. This is the one function that turns a
 * search result into reserved inventory — everything downstream (payment,
 * confirmation) builds on the guarantee that inventory here was reserved
 * atomically and priced authoritatively.
 */
export async function createBooking(user, payload) {
  const { bookingType, travelers, contactEmail, contactPhone, specialRequests, couponCode } = payload;

  return withTransaction(async (session) => {
    let basePrice = 0;
    let currency = 'USD';
    let typeFields = {};

    if (bookingType === 'flight') {
      const { flightId, cabin, tripType = 'one_way', returnFlightId } = payload;
      const seats = travelers.length;

      const flight = await Flight.findById(flightId).session(session);
      if (!flight || !flight.isActive) throw ApiError.notFound('Flight not found or no longer available');

      const outbound = await inventory.holdFlightSeats(flightId, cabin, seats, session);
      basePrice += outbound.unitPrice * seats;
      currency = outbound.currency;

      if (tripType === 'round_trip') {
        if (!returnFlightId) throw ApiError.badRequest('returnFlightId is required for round-trip bookings');
        try {
          const inbound = await inventory.holdFlightSeats(returnFlightId, cabin, seats, session);
          basePrice += inbound.unitPrice * seats;
        } catch (err) {
          // Roll back the outbound hold we just took, since the pair must
          // succeed or fail together — the transaction will also abort
          // this whole operation, but releasing explicitly keeps intent
          // clear if this function is ever called outside a transaction.
          await inventory.releaseFlightSeats(flightId, cabin, seats, session);
          throw err;
        }
      }

      typeFields = {
        flight: { flightRef: flightId, cabin, seatsBooked: seats, tripType, ...(returnFlightId ? { returnFlightRef: returnFlightId } : {}) },
      };
    } else if (bookingType === 'hotel') {
      const { hotelId, roomTypeId, checkIn, checkOut, rooms = 1 } = payload;

      const hotel = await Hotel.findById(hotelId).session(session);
      if (!hotel || !hotel.isActive) throw ApiError.notFound('Hotel not found or no longer available');
      const roomType = await RoomType.findOne({ _id: roomTypeId, hotel: hotelId }).session(session);
      if (!roomType) throw ApiError.notFound('Room type not found for this hotel');

      const held = await inventory.holdHotelRooms(roomTypeId, checkIn, checkOut, rooms, session);
      basePrice = held.unitPrice * held.nights * rooms;
      currency = held.currency;

      typeFields = {
        hotel: { hotelRef: hotelId, roomTypeRef: roomTypeId, roomsBooked: rooms, checkIn, checkOut, nights: held.nights },
      };
    } else if (bookingType === 'package') {
      const { packageId, departureDateId, travelerSlots } = payload;

      const pkg = await TravelPackage.findById(packageId).session(session);
      if (!pkg || !pkg.isActive) throw ApiError.notFound('Package not found or no longer available');
      const slots = travelerSlots || travelers.length;
      if (slots > pkg.maxTravelersPerBooking) {
        throw ApiError.badRequest(`This package allows a maximum of ${pkg.maxTravelersPerBooking} travelers per booking`);
      }

      const held = await inventory.holdPackageSlots(packageId, departureDateId, slots, session);
      basePrice = held.unitPrice * slots;
      currency = held.currency;

      const dep = pkg.departureDates.id(departureDateId);
      typeFields = {
        package: { packageRef: packageId, departureDateId, startDate: dep.startDate, travelerSlots: slots },
      };
    } else {
      throw ApiError.badRequest('Invalid booking type');
    }

    // Coupon validation happens after we know the authoritative base
    // price, since minimum-value rules depend on it.
    let coupon = null;
    if (couponCode) {
      coupon = await validateCoupon({ code: couponCode, userId: user._id, bookingType, basePrice, session });
    }

    const pricing = buildPricing({ basePrice, currency, coupon });

    const [booking] = await Booking.create(
      [
        {
          user: user._id,
          bookingType,
          ...typeFields,
          travelers,
          contactEmail: contactEmail || user.email,
          contactPhone,
          specialRequests,
          pricing,
          status: 'PAYMENT_PENDING',
          paymentStatus: 'UNPAID',
          holdExpiresAt: new Date(Date.now() + HOLD_MS()),
        },
      ],
      { session }
    );

    if (coupon) {
      await Coupon.updateOne({ _id: coupon._id }, { $inc: { usageCount: 1 } }, { session });
    }

    return booking;
  });
}

/**
 * Releases a booking's held inventory and marks it EXPIRED. Called by the
 * expiration cron job for holds past `holdExpiresAt`, and can also be
 * invoked directly if payment definitively fails.
 */
export async function expireBooking(bookingId) {
  return withTransaction(async (session) => {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) return null;
    if (!['PENDING', 'PAYMENT_PENDING'].includes(booking.status)) return booking; // already resolved

    await releaseBookingInventory(booking, session);

    booking.status = 'EXPIRED';
    if (booking.paymentStatus === 'UNPAID') booking.paymentStatus = 'FAILED';
    await booking.save({ session });

    logger.info(`Booking ${booking.bookingReference} expired; inventory released`);
    return booking;
  });
}

/**
 * Converts held inventory into confirmed/booked inventory. Called only
 * after the payment provider has verified a successful payment — never
 * from a client-supplied "payment succeeded" flag.
 */
export async function confirmBooking(bookingId, session) {
  const booking = await Booking.findById(bookingId).session(session);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.status === 'CONFIRMED') return booking; // idempotent
  if (booking.status !== 'PAYMENT_PENDING') {
    throw ApiError.conflict(`Cannot confirm a booking in status ${booking.status}`);
  }

  if (booking.bookingType === 'flight') {
    const { flightRef, cabin, seatsBooked, tripType, returnFlightRef } = booking.flight;
    await inventory.confirmFlightSeats(flightRef, cabin, seatsBooked, session);
    if (tripType === 'round_trip' && returnFlightRef) {
      await inventory.confirmFlightSeats(returnFlightRef, cabin, seatsBooked, session);
    }
  } else if (booking.bookingType === 'hotel') {
    const { roomTypeRef, checkIn, checkOut, roomsBooked } = booking.hotel;
    await inventory.confirmHotelRooms(roomTypeRef, checkIn, checkOut, roomsBooked, session);
  } else if (booking.bookingType === 'package') {
    const { packageRef, departureDateId, travelerSlots } = booking.package;
    await inventory.confirmPackageSlots(packageRef, departureDateId, travelerSlots, session);
  }

  booking.status = 'CONFIRMED';
  booking.paymentStatus = 'PAID';
  await booking.save({ session });
  return booking;
}

async function releaseBookingInventory(booking, session) {
  if (booking.bookingType === 'flight') {
    const { flightRef, cabin, seatsBooked, tripType, returnFlightRef } = booking.flight;
    await inventory.releaseFlightSeats(flightRef, cabin, seatsBooked, session);
    if (tripType === 'round_trip' && returnFlightRef) {
      await inventory.releaseFlightSeats(returnFlightRef, cabin, seatsBooked, session);
    }
  } else if (booking.bookingType === 'hotel') {
    const { roomTypeRef, checkIn, checkOut, roomsBooked } = booking.hotel;
    await inventory.releaseHotelRooms(roomTypeRef, checkIn, checkOut, roomsBooked, session);
  } else if (booking.bookingType === 'package') {
    const { packageRef, departureDateId, travelerSlots } = booking.package;
    await inventory.releasePackageSlots(packageRef, departureDateId, travelerSlots, session);
  }
}

/** Returns the travel date this booking is "for", used for cancellation-window checks. */
function getTravelDate(booking) {
  if (booking.bookingType === 'flight') return null; // uses departureTime on the Flight doc instead; see cancelBooking
  if (booking.bookingType === 'hotel') return booking.hotel.checkIn;
  if (booking.bookingType === 'package') return booking.package.startDate;
  return null;
}

const CANCELLATION_WINDOW_HOURS = 48;

/**
 * Cancels a booking. Unpaid holds are released immediately. Confirmed
 * (paid) bookings are checked against a cancellation window and, if
 * eligible, have their inventory released and are marked
 * REFUND_PENDING — the actual refund call to the payment provider happens
 * in the payments layer, which alone can confirm money has moved.
 */
export async function cancelBooking(bookingId, requestingUser, reason) {
  return withTransaction(async (session) => {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw ApiError.notFound('Booking not found');

    const isOwner = booking.user.toString() === requestingUser._id.toString();
    if (!isOwner && requestingUser.role !== 'admin') {
      throw ApiError.forbidden('You do not have access to this booking');
    }

    if (['CANCELLED', 'EXPIRED', 'COMPLETED'].includes(booking.status)) {
      throw ApiError.conflict(`Booking is already ${booking.status.toLowerCase()} and cannot be cancelled`);
    }

    // Not yet paid: simple cancel, release the hold, no refund involved.
    if (booking.status === 'PENDING' || booking.status === 'PAYMENT_PENDING') {
      await releaseBookingInventory(booking, session);
      booking.status = 'CANCELLED';
      booking.cancellation = {
        status: 'CANCELLED',
        reason,
        requestedAt: new Date(),
        cancelledAt: new Date(),
      };
      await booking.save({ session });
      return booking;
    }

    // Paid/confirmed: check the cancellation window.
    let travelDate = getTravelDate(booking);
    if (booking.bookingType === 'flight') {
      const flight = await Flight.findById(booking.flight.flightRef).session(session).lean();
      travelDate = flight?.departureTime;
    }

    const eligible = travelDate
      ? new Date(travelDate).getTime() - Date.now() > CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000
      : true;

    if (!eligible) {
      throw ApiError.badRequest(
        `This booking can no longer be cancelled — cancellations must be made at least ${CANCELLATION_WINDOW_HOURS} hours before travel`
      );
    }

    await releaseBookingInventory(booking, session);
    booking.status = 'CANCELLED';
    booking.cancellation = {
      status: 'REFUND_PENDING',
      reason,
      requestedAt: new Date(),
      cancelledAt: new Date(),
      refundAmount: booking.pricing.total,
    };
    await booking.save({ session });
    return booking;
  });
}
