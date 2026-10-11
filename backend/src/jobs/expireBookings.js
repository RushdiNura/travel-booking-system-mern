import cron from 'node-cron';
import { Booking } from '../models/Booking.js';
import { expireBooking } from '../services/bookingService.js';
import { logger } from '../utils/logger.js';

/**
 * Runs every minute. Finds unpaid holds past their expiry and releases
 * their inventory one at a time (each release is its own transaction via
 * expireBooking), so one failure doesn't block the rest of the batch.
 */
async function runExpirationSweep() {
  const expiredCandidates = await Booking.find({
    status: { $in: ['PENDING', 'PAYMENT_PENDING'] },
    holdExpiresAt: { $lte: new Date() },
  })
    .select('_id bookingReference')
    .lean();

  if (expiredCandidates.length === 0) return;

  logger.info(`[expirationJob] Found ${expiredCandidates.length} expired hold(s) to release`);

  for (const candidate of expiredCandidates) {
    try {
      await expireBooking(candidate._id);
    } catch (err) {
      logger.error(`[expirationJob] Failed to expire booking ${candidate.bookingReference}: ${err.message}`);
    }
  }
}

let task = null;

export function startExpirationJob() {
  if (task) return task;
  // Every minute — frequent enough that a 15-minute hold window doesn't
  // drift noticeably, cheap enough not to matter at this scale.
  task = cron.schedule('* * * * *', runExpirationSweep);
  logger.info('[expirationJob] Booking hold expiration job scheduled (every minute)');
  return task;
}

export function stopExpirationJob() {
  task?.stop();
  task = null;
}

// Exported for tests / manual triggering without waiting on the schedule.
export { runExpirationSweep };
