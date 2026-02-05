import { describe, it, expect } from 'vitest';
import { asUser, validDecision } from './setup.js';

describe('Decisions API', () => {
  describe('POST /api/decisions', () => {
    it('creates a decision as proposal', async () => {
      const a = await asUser('A');
      const res = await a.post('/api/decisions').send(validDecision);
      expect(res.status).toBe(201);
      expect(res.body.name).toBe(validDecision.name);
      expect(res.body.status).toBe('proposal');
      expect(res.body.created_by).toBe('A');
    });

    it('auto-approves by creator', async () => {
      const a = await asUser('A');
      const res = await a.post('/api/decisions').send(validDecision);
      expect(res.body.approved_by_a).toBe(1);
      expect(res.body.approved_by_b).toBe(0);
    });

    it('rejects invalid input', async () => {
      const a = await asUser('A');
      const res = await a.post('/api/decisions').send({ name: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/decisions', () => {
    it('returns empty list initially', async () => {
      const a = await asUser('A');
      const res = await a.get('/api/decisions');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns created decisions', async () => {
      const a = await asUser('A');
      await a.post('/api/decisions').send(validDecision);
      const res = await a.get('/api/decisions');
      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /api/decisions/:id', () => {
    it('returns a decision by id', async () => {
      const a = await asUser('A');
      const created = await a.post('/api/decisions').send(validDecision);
      const res = await a.get(`/api/decisions/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
    });

    it('returns 404 for non-existent decision', async () => {
      const a = await asUser('A');
      const res = await a.get('/api/decisions/999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/decisions/:id/approve', () => {
    it('transitions to approved when both approve', async () => {
      const a = await asUser('A');
      const created = await a.post('/api/decisions').send(validDecision);
      const id = created.body.id;

      const b = await asUser('B');
      const res = await b.post(`/api/decisions/${id}/approve`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
      expect(res.body.approved_by_b).toBe(1);
    });

    it('stays as proposal with only creator approval', async () => {
      const a = await asUser('A');
      const created = await a.post('/api/decisions').send(validDecision);
      expect(created.body.status).toBe('proposal');
      expect(created.body.approved_by_a).toBe(1);
    });

    it('rejects approval of non-proposal', async () => {
      const a = await asUser('A');
      const created = await a.post('/api/decisions').send(validDecision);
      const id = created.body.id;
      const b = await asUser('B');
      await b.post(`/api/decisions/${id}/approve`);

      // Now it's approved, try to approve again
      const res = await a.post(`/api/decisions/${id}/approve`);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/decisions/:id/close', () => {
    it('closes an approved decision', async () => {
      const a = await asUser('A');
      const created = await a.post('/api/decisions').send(validDecision);
      const id = created.body.id;
      const b = await asUser('B');
      await b.post(`/api/decisions/${id}/approve`);

      const res = await a.post(`/api/decisions/${id}/close`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('closed');
    });

    it('rejects closing a proposal', async () => {
      const a = await asUser('A');
      const created = await a.post('/api/decisions').send(validDecision);
      const res = await a.post(`/api/decisions/${created.body.id}/close`);
      expect(res.status).toBe(400);
    });
  });
});
