import { describe, it, expect } from 'vitest';
import { asUser, fullResponsibility, createApprovedDecision, lockAssessment } from './setup.js';

describe('Responsibilities API', () => {
  describe('GET /api/decisions/:id/responsibilities/mine', () => {
    it('returns null when no responsibility exists', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const res = await a.get(`/api/decisions/${id}/responsibilities/mine`);
      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });
  });

  describe('PUT /api/decisions/:id/responsibilities/mine', () => {
    it('creates a responsibility', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const res = await a.put(`/api/decisions/${id}/responsibilities/mine`).send(fullResponsibility);
      expect(res.status).toBe(200);
      expect(res.body.brought_topic).toBe('me');
      expect(res.body.pushed_execution).toBe('both');
      expect(res.body.main_burden).toBe('partner');
    });

    it('updates an existing responsibility', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      await a.put(`/api/decisions/${id}/responsibilities/mine`).send(fullResponsibility);

      const updated = { ...fullResponsibility, brought_topic: 'partner' as const };
      const res = await a.put(`/api/decisions/${id}/responsibilities/mine`).send(updated);
      expect(res.body.brought_topic).toBe('partner');
    });

    it('rejects update when assessment is locked', async () => {
      const id = await createApprovedDecision();
      await lockAssessment('A', id);

      const a = await asUser('A');
      const res = await a.put(`/api/decisions/${id}/responsibilities/mine`).send(fullResponsibility);
      expect(res.status).toBe(403);
    });

    it('allows different users to have different responsibilities', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const b = await asUser('B');

      await a.put(`/api/decisions/${id}/responsibilities/mine`).send(fullResponsibility);
      await b.put(`/api/decisions/${id}/responsibilities/mine`).send({
        brought_topic: 'partner',
        pushed_execution: 'me',
        main_burden: 'both',
      });

      const resA = await a.get(`/api/decisions/${id}/responsibilities/mine`);
      const resB = await b.get(`/api/decisions/${id}/responsibilities/mine`);
      expect(resA.body.brought_topic).toBe('me');
      expect(resB.body.brought_topic).toBe('partner');
    });
  });

  describe('GET /api/decisions/:id/responsibilities/compare', () => {
    it('returns 403 when assessments are not both locked', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      await a.put(`/api/decisions/${id}/responsibilities/mine`).send(fullResponsibility);

      const res = await a.get(`/api/decisions/${id}/responsibilities/compare`);
      expect(res.status).toBe(403);
    });

    it('returns comparison when both assessments are locked', async () => {
      const id = await createApprovedDecision();
      await lockAssessment('A', id);
      await lockAssessment('B', id);

      const a = await asUser('A');
      const res = await a.get(`/api/decisions/${id}/responsibilities/compare`);
      expect(res.status).toBe(200);
      expect(res.body.mine).toBeDefined();
      expect(res.body.partner).toBeDefined();
      expect(res.body.mine.user_id).toBe('A');
      expect(res.body.partner.user_id).toBe('B');
    });
  });
});
