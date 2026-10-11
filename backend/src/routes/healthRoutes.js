import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/', (_req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  return new ApiResponse(200, {
    status: 'ok',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    database: dbStates[mongoose.connection.readyState] || 'unknown',
    integrations: {
      stripe: env.stripe.configured,
      email: env.email.configured,
      weather: true, // Open-Meteo needs no key
      ai: env.ai.configured,
    },
  }).send(res);
});

export default router;
