import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';
import * as emailService from './emailService.js';

async function createAndSend({ userId, type, title, message, link, relatedBooking, emailFn }) {
  const notification = await Notification.create({ user: userId, type, title, message, link, relatedBooking });

  try {
    const user = await User.findById(userId);
    if (user && emailFn) {
      const result = await emailFn(user);
      notification.emailSent = Boolean(result?.sent);
      await notification.save();
    }
  } catch (err) {
    // A failed email should never roll back the notification or the
    // booking state change that triggered it — log and move on.
    logger.error(`Failed to send notification email (${type}) to user ${userId}: ${err.message}`);
  }

  return notification;
}

export const notifyBookingConfirmed = (booking) =>
  createAndSend({
    userId: booking.user,
    type: 'BOOKING_CONFIRMED',
    title: 'Booking confirmed',
    message: `Your booking ${booking.bookingReference} is confirmed.`,
    link: `/dashboard/bookings/${booking._id}`,
    relatedBooking: booking._id,
    emailFn: (user) => emailService.sendBookingConfirmationEmail(user, booking),
  });

export const notifyPaymentFailed = (booking) =>
  createAndSend({
    userId: booking.user,
    type: 'PAYMENT_FAILED',
    title: 'Payment did not go through',
    message: `We couldn't process payment for booking ${booking.bookingReference}. Your hold is still active — please try again.`,
    link: `/bookings/${booking._id}/pay`,
    relatedBooking: booking._id,
    emailFn: (user) => emailService.sendPaymentFailedEmail(user, booking),
  });

export const notifyBookingCancelled = (booking) =>
  createAndSend({
    userId: booking.user,
    type: 'BOOKING_CANCELLED',
    title: 'Booking cancelled',
    message: `Booking ${booking.bookingReference} has been cancelled.`,
    link: `/dashboard/bookings/${booking._id}`,
    relatedBooking: booking._id,
    emailFn: (user) => emailService.sendCancellationEmail(user, booking),
  });

export const notifyRefundIssued = (booking) =>
  createAndSend({
    userId: booking.user,
    type: 'REFUND_ISSUED',
    title: 'Refund issued',
    message: `A refund has been issued for booking ${booking.bookingReference}.`,
    link: `/dashboard/bookings/${booking._id}`,
    relatedBooking: booking._id,
    emailFn: (user) => emailService.sendRefundEmail(user, booking),
  });

export const notifyTripReminder = (booking) =>
  createAndSend({
    userId: booking.user,
    type: 'TRIP_REMINDER',
    title: 'Upcoming trip',
    message: `Your trip for booking ${booking.bookingReference} is coming up soon.`,
    link: `/dashboard/bookings/${booking._id}`,
    relatedBooking: booking._id,
    emailFn: (user) => emailService.sendTripReminderEmail(user, booking),
  });
