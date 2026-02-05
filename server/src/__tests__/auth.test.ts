import { describe, it, expect } from 'vitest';
import { getApp } from './setup.js';

describe('Auth middleware', () => {
  it('returns 401 when X-User-Id header is missing', async () => {
    const app = await getApp();
    const res = await app.get('/api/decisions');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 when X-User-Id is invalid', async () => {
    const app = await getApp();
    const res = await app.get('/api/decisions').set('X-User-Id', 'C');
    expect(res.status).toBe(401);
  });

  it('returns 401 for lowercase user id', async () => {
    const app = await getApp();
    const res = await app.get('/api/decisions').set('X-User-Id', 'a');
    expect(res.status).toBe(401);
  });

  it('succeeds with valid X-User-Id A', async () => {
    const app = await getApp();
    const res = await app.get('/api/decisions').set('X-User-Id', 'A');
    expect(res.status).toBe(200);
  });

  it('succeeds with valid X-User-Id B', async () => {
    const app = await getApp();
    const res = await app.get('/api/decisions').set('X-User-Id', 'B');
    expect(res.status).toBe(200);
  });
});
