process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
process.env.JWT_EXPIRES_IN = '1h';
// Overridden per-test-run by the in-memory replica set's real URI in
// tests/setup.js — this placeholder only satisfies env.js's startup check,
// which runs before that connection exists.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/aerlume-test-placeholder';
process.env.STRIPE_SECRET_KEY = '';
process.env.STRIPE_WEBHOOK_SECRET = '';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.BOOKING_HOLD_MINUTES = '15';
process.env.RATE_LIMIT_MAX_REQUESTS = '10000'; // don't let rate limiting interfere with test runs
