import mongoose from 'mongoose';
import { logger } from './logger.js';

/**
 * Runs `fn` inside a MongoDB transaction, retrying on transient errors.
 *
 * Why this matters for booking: two users can request the last seat/room
 * at the same instant. Both transactions read the same "1 available"
 * state, but MongoDB's transaction machinery detects that both attempt to
 * write the same document and aborts one with a TransientTransactionError.
 * That loser retries, re-reads the now-updated state, and correctly sees
 * 0 available — this is what actually prevents double-booking, not the
 * application-level availability check alone (which is still necessary
 * for a fast, correct first read).
 *
 * Requires MongoDB to be running as a replica set (Atlas is, by default;
 * a local single-node `mongod` is not unless explicitly initiated as one).
 */
export async function withTransaction(fn, { maxRetries = 3 } = {}) {
  const session = await mongoose.startSession();
  try {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      attempt += 1;
      try {
        let result;
        await session.withTransaction(async () => {
          result = await fn(session);
        });
        return result;
      } catch (err) {
        const isTransient =
          err.errorLabels?.includes('TransientTransactionError') ||
          err.errorLabels?.includes('UnknownTransactionCommitResult');
        if (isTransient && attempt < maxRetries) {
          logger.warn(`Transaction attempt ${attempt} failed transiently, retrying: ${err.message}`);
          continue;
        }
        throw err;
      }
    }
  } finally {
    await session.endSession();
  }
}
