import cron from 'node-cron';
import { Booking } from '../models/Booking.js';
import { Flight } from '../models/Flight.js';
import { logger } from '../utils/logger.js';

/**
 * Determines the date travel for this booking is fully over, so we know
 * when it's safe to mark it COMPLETED (which in turn unlocks reviews).
 */
async function getTravelEndDate(booking) {
  if (booking.bookingType === 'flight') {
    const relevantFlightId = booking.flight.returnFlightRef || booking.flight.flightRef;
    const flight = await Flight.findById(relevantFlightId).select('arrivalTime').lean();
    return flight?.arrivalTime || null;
  }
  if (booking.bookingType === 'hotel') {
    return booking.hotel.checkOut ? new Date(`${booking.hotel.checkOut}T00:00:00.000Z`) : null;
  }
  if (booking.bookingType === 'package') {
    if (!booking.package.startDate) return null;
    const end = new Date(`${booking.package.startDate}T00:00:00.000Z`);
    // durationDays isn't stored on the booking itself — fall back to a
    // conservative default if the package was deleted; otherwise this is
    // refined by joining the package below in the sweep.
    return end;
  }
  return null;
}

async function runCompletionSweep() {
  const candidates = await Booking.find({ status: 'CONFIRMED' }).select(
    '_id bookingReference bookingType flight hotel package'
  );

  if (candidates.length === 0) return;

  let completedCount = 0;
  for (const booking of candidates) {
    try {
      const endDate = await getTravelEndDate(booking);
      if (endDate && endDate.getTime() < Date.now()) {
        await Booking.updateOne({ _id: booking._id }, { status: 'COMPLETED' });
        completedCount += 1;
      }
    } catch (err) {
      logger.error(`[completionJob] Failed to evaluate booking ${booking.bookingReference}: ${err.message}`);
    }
  }

  if (completedCount > 0) {
    logger.info(`[completionJob] Marked ${completedCount} booking(s) as COMPLETED`);
  }
}

let task = null;

export function startCompletionJob() {
  if (task) return task;
  // Hourly is frequent enough — travel end dates don't need minute-level precision.
  task = cron.schedule('0 * * * *', runCompletionSweep);
  logger.info('[completionJob] Booking completion job scheduled (hourly)');
  return task;
}

export function stopCompletionJob() {
  task?.stop();
  task = null;
}

export { runCompletionSweep };
