import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: env.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'Too many requests, please try again later' },
});

// Tighter limit on auth endpoints to blunt brute-force / credential-stuffing.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, statusCode: 429, message: 'Too many attempts, please try again later' },
});

// Stripe webhooks arrive frequently and authenticate via signature, not
// this limiter, but a generous ceiling still protects against abuse.
export const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// AI trip planner calls a paid external API and shouldn't be spammable —
// a tighter cap than the general limiter.
export const aiPlannerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'AI trip planner rate limit reached — please try again in an hour' },
});
