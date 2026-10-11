import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { app } from './app.js';
import { logger } from './utils/logger.js';
import { startExpirationJob, stopExpirationJob } from './jobs/expireBookings.js';
import { startCompletionJob, stopCompletionJob } from './jobs/completeBookings.js';

let server;

const start = async () => {
  await connectDB();

  server = app.listen(env.port, () => {
    logger.info(`Aerlume API listening on port ${env.port} [${env.nodeEnv}]`);
  });

  if (!env.isTest) {
    startExpirationJob();
    startCompletionJob();
  }
};

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
  server?.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  stopExpirationJob();
  stopCompletionJob();
  server?.close(() => process.exit(0));
});

start();
