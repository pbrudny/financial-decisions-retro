import { describe, it, expect } from 'vitest';
import { asUser, fullAssessment, fullResponsibility, createApprovedDecision, lockAssessment } from './setup.js';

describe('Assessments API', () => {
  describe('GET /api/decisions/:id/assessments/mine', () => {
    it('returns null when no assessment exists', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const res = await a.get(`/api/decisions/${id}/assessments/mine`);
      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });
  });

  describe('PUT /api/decisions/:id/assessments/mine', () => {
    it('creates an assessment', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const res = await a.put(`/api/decisions/${id}/assessments/mine`).send(fullAssessment);
      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(4);
      expect(res.body.items).toHaveLength(2);
    });

    it('updates an existing assessment', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      await a.put(`/api/decisions/${id}/assessments/mine`).send(fullAssessment);

      const updated = { ...fullAssessment, rating: 2 };
      const res = await a.put(`/api/decisions/${id}/assessments/mine`).send(updated);
      expect(res.body.rating).toBe(2);
    });

    it('rejects update on locked assessment', async () => {
      const id = await createApprovedDecision();
      await lockAssessment('A', id);

      const a = await asUser('A');
      const res = await a.put(`/api/decisions/${id}/assessments/mine`).send(fullAssessment);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/decisions/:id/assessments/mine/lock', () => {
    it('locks a complete assessment', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      await a.put(`/api/decisions/${id}/assessments/mine`).send(fullAssessment);
      await a.put(`/api/decisions/${id}/responsibilities/mine`).send(fullResponsibility);

      const res = await a.post(`/api/decisions/${id}/assessments/mine/lock`);
      expect(res.status).toBe(200);
      expect(res.body.locked).toBe(true);
    });

    it('rejects lock when rating is missing', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const incomplete = { ...fullAssessment, rating: null };
      await a.put(`/api/decisions/${id}/assessments/mine`).send(incomplete);
      await a.put(`/api/decisions/${id}/responsibilities/mine`).send(fullResponsibility);

      const res = await a.post(`/api/decisions/${id}/assessments/mine/lock`);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Ocena');
    });

    it('rejects lock when would_do_again is missing', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const incomplete = { ...fullAssessment, would_do_again: null };
      await a.put(`/api/decisions/${id}/assessments/mine`).send(incomplete);
      await a.put(`/api/decisions/${id}/responsibilities/mine`).send(fullResponsibility);

      const res = await a.post(`/api/decisions/${id}/assessments/mine/lock`);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('ponownie');
    });

    it('rejects lock when biggest_ignored_risk is missing', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const incomplete = { ...fullAssessment, biggest_ignored_risk: null };
      await a.put(`/api/decisions/${id}/assessments/mine`).send(incomplete);
      await a.put(`/api/decisions/${id}/responsibilities/mine`).send(fullResponsibility);

      const res = await a.post(`/api/decisions/${id}/assessments/mine/lock`);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('ryzyko');
    });

    it('rejects lock when no pros', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const noPros = {
        ...fullAssessment,
        items: [{ type: 'con' as const, text: 'Bad', sort_order: 0 }],
      };
      await a.put(`/api/decisions/${id}/assessments/mine`).send(noPros);
      await a.put(`/api/decisions/${id}/responsibilities/mine`).send(fullResponsibility);

      const res = await a.post(`/api/decisions/${id}/assessments/mine/lock`);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('za');
    });

    it('rejects lock when no cons', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const noCons = {
        ...fullAssessment,
        items: [{ type: 'pro' as const, text: 'Good', sort_order: 0 }],
      };
      await a.put(`/api/decisions/${id}/assessments/mine`).send(noCons);
      await a.put(`/api/decisions/${id}/responsibilities/mine`).send(fullResponsibility);

      const res = await a.post(`/api/decisions/${id}/assessments/mine/lock`);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('przeciw');
    });

    it('rejects lock when responsibility is not filled', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      await a.put(`/api/decisions/${id}/assessments/mine`).send(fullAssessment);

      const res = await a.post(`/api/decisions/${id}/assessments/mine/lock`);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('odpowiedzialności');
    });

    it('rejects lock on already locked assessment', async () => {
      const id = await createApprovedDecision();
      await lockAssessment('A', id);

      const a = await asUser('A');
      const res = await a.post(`/api/decisions/${id}/assessments/mine/lock`);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/decisions/:id/assessments/status', () => {
    it('returns lock status for both users', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const res = await a.get(`/api/decisions/${id}/assessments/status`);
      expect(res.status).toBe(200);
      expect(res.body.a_locked).toBe(false);
      expect(res.body.b_locked).toBe(false);
    });

    it('reflects locked status after lock', async () => {
      const id = await createApprovedDecision();
      await lockAssessment('A', id);

      const a = await asUser('A');
      const res = await a.get(`/api/decisions/${id}/assessments/status`);
      expect(res.body.a_locked).toBe(true);
      expect(res.body.b_locked).toBe(false);
    });
  });

  describe('GET /api/decisions/:id/assessments/compare', () => {
    it('returns 403 when only one is locked', async () => {
      const id = await createApprovedDecision();
      await lockAssessment('A', id);

      // B has an assessment but it's not locked
      const b = await asUser('B');
      await b.put(`/api/decisions/${id}/assessments/mine`).send(fullAssessment);

      const a = await asUser('A');
      const res = await a.get(`/api/decisions/${id}/assessments/compare`);
      expect(res.status).toBe(403);
    });

    it('returns comparison when both are locked', async () => {
      const id = await createApprovedDecision();
      await lockAssessment('A', id);
      await lockAssessment('B', id);

      const a = await asUser('A');
      const res = await a.get(`/api/decisions/${id}/assessments/compare`);
      expect(res.status).toBe(200);
      expect(res.body.mine).toBeDefined();
      expect(res.body.partner).toBeDefined();
      expect(res.body.mine.items).toBeDefined();
      expect(res.body.partner.items).toBeDefined();
    });

    it('returns correct mine/partner perspective', async () => {
      const id = await createApprovedDecision();
      await lockAssessment('A', id);
      await lockAssessment('B', id);

      const a = await asUser('A');
      const resA = await a.get(`/api/decisions/${id}/assessments/compare`);
      expect(resA.body.mine.user_id).toBe('A');
      expect(resA.body.partner.user_id).toBe('B');

      const b = await asUser('B');
      const resB = await b.get(`/api/decisions/${id}/assessments/compare`);
      expect(resB.body.mine.user_id).toBe('B');
      expect(resB.body.partner.user_id).toBe('A');
    });
  });
});
