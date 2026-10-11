import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'BOOKING_CONFIRMED',
        'PAYMENT_RECEIVED',
        'PAYMENT_FAILED',
        'BOOKING_CANCELLED',
        'REFUND_ISSUED',
        'TRIP_REMINDER',
        'ACCOUNT',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // e.g. /dashboard/bookings/:id
    relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    isRead: { type: Boolean, default: false, index: true },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
