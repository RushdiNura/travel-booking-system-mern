import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';
import { stripeWebhook } from './controllers/paymentController.js';

export const app = express();

app.set('trust proxy', 1); // needed for correct client IPs / rate limiting behind Render/Railway/Vercel

// ── Security headers ────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

// ── Stripe webhook: must receive the RAW body for signature verification,
// so it's mounted before the JSON body parser below. ──────────────────
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// ── Body parsing ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(compression());

// ── Sanitization against NoSQL injection and XSS payloads ────────────
app.use(mongoSanitize());
app.use(xss());

// ── Logging ──────────────────────────────────────────────────────────
if (!env.isTest) {
  app.use(
    morgan(env.isProd ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.http?.(msg.trim()) ?? logger.info(msg.trim()) },
    })
  );
}

// ── Rate limiting ────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ── Routes ───────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── 404 + error handling ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);
