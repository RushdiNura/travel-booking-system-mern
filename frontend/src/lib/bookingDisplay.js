export const STATUS_VARIANT = {
  PENDING: 'neutral',
  PAYMENT_PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'error',
  COMPLETED: 'info',
  EXPIRED: 'error',
};

export const PAYMENT_VARIANT = {
  UNPAID: 'neutral',
  PROCESSING: 'warning',
  PAID: 'success',
  FAILED: 'error',
  REFUNDED: 'info',
  PARTIALLY_REFUNDED: 'info',
};

export function bookingTitle(booking) {
  if (booking.bookingType === 'flight') {
    return `${booking.flight?.flightRef?.origin?.code || '?'} → ${booking.flight?.flightRef?.destination?.code || '?'}`;
  }
  if (booking.bookingType === 'hotel') return booking.hotel?.hotelRef?.name || 'Hotel booking';
  if (booking.bookingType === 'package') return booking.package?.packageRef?.title || 'Package booking';
  return 'Booking';
}
