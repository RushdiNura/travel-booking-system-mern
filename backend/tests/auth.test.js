import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js';
import { registerAndGetToken } from './helpers/factory.js';

beforeAll(connectTestDB);
afterAll(closeTestDB);
beforeEach(clearTestDB);

describe('Auth', () => {
  it('registers a new user and returns a token', async () => {
    const { raw } = await registerAndGetToken({ email: 'newuser@test.com' });
    expect(raw.status).toBe(201);
    expect(raw.body.data.token).toBeTruthy();
    expect(raw.body.data.user.email).toBe('newuser@test.com');
    expect(raw.body.data.user.password).toBeUndefined(); // never returned
  });

  it('rejects registration with a weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Weak', email: 'weak@test.com', password: 'weak' });
    expect(res.status).toBe(422);
  });

  it('rejects duplicate registration for the same email', async () => {
    await registerAndGetToken({ email: 'dupe@test.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dupe', email: 'dupe@test.com', password: 'TestPass123' });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    await registerAndGetToken({ email: 'login@test.com', password: 'CorrectPass1' });
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.com', password: 'CorrectPass1' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it('rejects login with an incorrect password', async () => {
    await registerAndGetToken({ email: 'wrongpass@test.com', password: 'CorrectPass1' });
    const res = await request(app).post('/api/auth/login').send({ email: 'wrongpass@test.com', password: 'WrongPass1' });
    expect(res.status).toBe(401);
  });

  it('rejects login for a nonexistent account with the same generic message as a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ghost@test.com', password: 'Whatever123' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('blocks access to a protected route without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('blocks access to a protected route with an invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('allows access to a protected route with a valid token', async () => {
    const { token } = await registerAndGetToken();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('locks the account after repeated failed login attempts', async () => {
    await registerAndGetToken({ email: 'lockout@test.com', password: 'CorrectPass1' });
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({ email: 'lockout@test.com', password: 'WrongPass1' });
    }
    const res = await request(app).post('/api/auth/login').send({ email: 'lockout@test.com', password: 'CorrectPass1' });
    expect(res.status).toBe(403); // locked, even with the correct password now
  });
});
