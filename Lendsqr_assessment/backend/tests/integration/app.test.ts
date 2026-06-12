import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';

describe('app routes', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toEqual({ success: true, data: { status: 'ok' } });
  });

  it('returns consistent validation errors', async () => {
    const response = await request(app).post('/api/v1/users').send({ email: 'not-email' }).expect(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing faux auth', async () => {
    const response = await request(app).get('/api/v1/wallets/me').expect(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });
});
