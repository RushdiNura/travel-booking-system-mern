import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js';
import { registerAndGetToken } from './helpers/factory.js';

beforeAll(connectTestDB);
afterAll(closeTestDB);
beforeEach(clearTestDB);

describe('AI trip planner', () => {
  it('reports unconfigured status when AI_API_KEY is unset', async () => {
    const res = await request(app).get('/api/ai/status');
    expect(res.status).toBe(200);
    expect(res.body.data.configured).toBe(false); // AI_API_KEY is intentionally unset in tests/env.setup.js
  });

  it('requires authentication to request a trip plan', async () => {
    const res = await request(app).post('/api/ai/trip-plan').send({ destination: 'Lisbon', durationDays: 5 });
    expect(res.status).toBe(401);
  });

  it('returns a clear configuration error rather than a fake plan when unconfigured', async () => {
    const { token } = await registerAndGetToken();
    const res = await request(app)
      .post('/api/ai/trip-plan')
      .set('Authorization', `Bearer ${token}`)
      .send({ destination: 'Lisbon', durationDays: 5 });

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/not configured/i);
  });

  it('validates the request body before attempting to call the provider', async () => {
    const { token } = await registerAndGetToken();
    const res = await request(app)
      .post('/api/ai/trip-plan')
      .set('Authorization', `Bearer ${token}`)
      .send({ destination: '', durationDays: 999 });

    expect(res.status).toBe(422);
  });
});
