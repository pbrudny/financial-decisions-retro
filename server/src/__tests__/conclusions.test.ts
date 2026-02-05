import { describe, it, expect } from 'vitest';
import { asUser, createApprovedDecision, lockAssessment } from './setup.js';

describe('Conclusions API', () => {
  describe('GET /api/decisions/:id/conclusion', () => {
    it('returns 403 when assessments are not both locked', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const res = await a.get(`/api/decisions/${id}/conclusion`);
      expect(res.status).toBe(403);
    });

    it('returns null when no conclusion exists but both locked', async () => {
      const id = await createApprovedDecision();
      await lockAssessment('A', id);
      await lockAssessment('B', id);

      const a = await asUser('A');
      const res = await a.get(`/api/decisions/${id}/conclusion`);
      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });
  });

  describe('PUT /api/decisions/:id/conclusion', () => {
    it('returns 403 when assessments are not both locked', async () => {
      const id = await createApprovedDecision();
      const a = await asUser('A');
      const res = await a.put(`/api/decisions/${id}/conclusion`).send({ text: 'Conclusion' });
      expect(res.status).toBe(403);
    });

    it('creates a conclusion when both locked', async () => {
      const id = await createApprovedDecision();
      await lockAssessment('A', id);
      await lockAssessment('B', id);

      const a = await asUser('A');
      const res = await a.put(`/api/decisions/${id}/conclusion`).send({ text: 'Our conclusion' });
      expect(res.status).toBe(200);
      expect(res.body.text).toBe('Our conclusion');
      expect(res.body.decision_id).toBe(id);
    });

    it('updates an existing conclusion', async () => {
      const id = await createApprovedDecision();
      await lockAssessment('A', id);
      await lockAssessment('B', id);

      const a = await asUser('A');
      await a.put(`/api/decisions/${id}/conclusion`).send({ text: 'First' });
      const res = await a.put(`/api/decisions/${id}/conclusion`).send({ text: 'Updated' });
      expect(res.body.text).toBe('Updated');
    });
  });

  describe('Meta conclusions', () => {
    describe('GET /api/meta-conclusions', () => {
      it('returns empty list initially', async () => {
        const a = await asUser('A');
        const res = await a.get('/api/meta-conclusions');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
      });
    });

    describe('POST /api/meta-conclusions', () => {
      it('creates a meta conclusion', async () => {
        const a = await asUser('A');
        const res = await a.post('/api/meta-conclusions').send({
          type: 'bias',
          title: 'Confirmation bias',
          description: 'We tend to confirm existing beliefs',
        });
        expect(res.status).toBe(201);
        expect(res.body.type).toBe('bias');
        expect(res.body.title).toBe('Confirmation bias');
      });

      it('rejects invalid type', async () => {
        const a = await asUser('A');
        const res = await a.post('/api/meta-conclusions').send({
          type: 'invalid',
          title: 'Title',
          description: 'Desc',
        });
        expect(res.status).toBe(400);
      });
    });

    describe('PUT /api/meta-conclusions/:id', () => {
      it('updates a meta conclusion', async () => {
        const a = await asUser('A');
        const created = await a.post('/api/meta-conclusions').send({
          type: 'rule',
          title: 'Rule 1',
          description: 'Original description',
        });

        const res = await a.put(`/api/meta-conclusions/${created.body.id}`).send({
          title: 'Updated Rule',
        });
        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated Rule');
        expect(res.body.description).toBe('Original description');
      });

      it('returns 404 for non-existent', async () => {
        const a = await asUser('A');
        const res = await a.put('/api/meta-conclusions/999').send({ title: 'X' });
        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/meta-conclusions/:id', () => {
      it('deletes a meta conclusion', async () => {
        const a = await asUser('A');
        const created = await a.post('/api/meta-conclusions').send({
          type: 'red_flag',
          title: 'Red flag',
          description: 'Watch out',
        });

        const res = await a.delete(`/api/meta-conclusions/${created.body.id}`);
        expect(res.status).toBe(204);

        const list = await a.get('/api/meta-conclusions');
        expect(list.body).toHaveLength(0);
      });

      it('returns 404 for non-existent', async () => {
        const a = await asUser('A');
        const res = await a.delete('/api/meta-conclusions/999');
        expect(res.status).toBe(404);
      });
    });
  });
});
