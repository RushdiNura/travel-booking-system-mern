import winston from 'winston';
import { env } from '../config/env.js';

// Fields that must never reach a log line, even by accident (e.g. someone
// spreading req.body into a log call). This is a defense-in-depth net —
// call sites should still avoid logging sensitive objects directly.
const REDACT_KEYS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'confirmPassword',
  'token',
  'jwt',
  'cardNumber',
  'cvv',
  'cvc',
  'pin',
  'stripeSecretKey',
  'authorization',
]);

const redact = winston.format((info) => {
  const walk = (obj, depth = 0) => {
    if (!obj || typeof obj !== 'object' || depth > 4) return obj;
    for (const key of Object.keys(obj)) {
      if (REDACT_KEYS.has(key)) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        walk(obj[key], depth + 1);
      }
    }
    return obj;
  };
  return walk(info);
});

export const logger = winston.createLogger({
  level: env.isProd ? 'info' : 'debug',
  format: winston.format.combine(
    redact(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.isProd
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} ${level}: ${stack || message}`;
          })
        )
  ),
  transports: [new winston.transports.Console()],
});
