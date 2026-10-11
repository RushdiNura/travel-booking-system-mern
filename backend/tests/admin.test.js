import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js';
import { registerAndGetToken, createAdminAndGetToken, createFlight } from './helpers/factory.js';

beforeAll(connectTestDB);
afterAll(closeTestDB);
beforeEach(clearTestDB);

describe('Admin authorization', () => {
  it('blocks a regular user from the admin overview endpoint', async () => {
    const { token } = await registerAndGetToken();
    const res = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('blocks a regular user from listing all users', async () => {
    const { token } = await registerAndGetToken();
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('blocks a regular user from creating inventory', async () => {
    const { token } = await registerAndGetToken();
    const res = await request(app)
      .post('/api/admin/flights')
      .set('Authorization', `Bearer ${token}`)
      .send({ flightNumber: 'HACK1' });
    expect(res.status).toBe(403);
  });

  it('allows an admin to view the overview', async () => {
    const { token } = await createAdminAndGetToken();
    const res = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalUsers');
  });

  it('blocks deleting a flight that has an active booking', async () => {
    const { token: adminToken } = await createAdminAndGetToken();
    const { token: userToken } = await registerAndGetToken();
    const flight = await createFlight({ cabinClasses: [{ cabin: 'economy', price: 200, totalSeats: 5, availableSeats: 5 }] });

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bookingType: 'flight',
        flightId: flight._id,
        cabin: 'economy',
        travelers: [{ firstName: 'Jane', lastName: 'Doe' }],
        contactEmail: 'a@b.com',
      });

    const res = await request(app).delete(`/api/admin/flights/${flight._id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
  });
});
