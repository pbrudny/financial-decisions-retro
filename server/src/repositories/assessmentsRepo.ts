import db from '../db/connection.js';
import type { Assessment, AssessmentItem, AssessmentWithItems, UserId, UpdateAssessmentInput } from 'shared';

export const assessmentsRepo = {
  findByDecisionAndUser(decisionId: number, userId: UserId): Assessment | undefined {
    return db.prepare(
      'SELECT * FROM assessments WHERE decision_id = ? AND user_id = ?'
    ).get(decisionId, userId) as Assessment | undefined;
  },

  findItemsByAssessmentId(assessmentId: number): AssessmentItem[] {
    return db.prepare(
      'SELECT * FROM assessment_items WHERE assessment_id = ? ORDER BY sort_order'
    ).all(assessmentId) as AssessmentItem[];
  },

  findWithItems(decisionId: number, userId: UserId): AssessmentWithItems | undefined {
    const assessment = this.findByDecisionAndUser(decisionId, userId);
    if (!assessment) return undefined;
    const items = this.findItemsByAssessmentId(assessment.id);
    return { ...assessment, items };
  },

  upsert(decisionId: number, userId: UserId, input: UpdateAssessmentInput): AssessmentWithItems {
    const existing = this.findByDecisionAndUser(decisionId, userId);

    const upsertAssessment = db.transaction(() => {
      let assessmentId: number;

      if (existing) {
        db.prepare(`
          UPDATE assessments
          SET rating = ?, would_do_again = ?, biggest_ignored_risk = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(input.rating, input.would_do_again === null ? null : input.would_do_again ? 1 : 0, input.biggest_ignored_risk, existing.id);
        assessmentId = existing.id;
      } else {
        const result = db.prepare(`
          INSERT INTO assessments (decision_id, user_id, rating, would_do_again, biggest_ignored_risk)
          VALUES (?, ?, ?, ?, ?)
        `).run(decisionId, userId, input.rating, input.would_do_again === null ? null : input.would_do_again ? 1 : 0, input.biggest_ignored_risk);
        assessmentId = result.lastInsertRowid as number;
      }

      // Replace all items
      db.prepare('DELETE FROM assessment_items WHERE assessment_id = ?').run(assessmentId);
      const insertItem = db.prepare(
        'INSERT INTO assessment_items (assessment_id, type, text, sort_order) VALUES (?, ?, ?, ?)'
      );
      for (const item of input.items) {
        insertItem.run(assessmentId, item.type, item.text, item.sort_order);
      }

      return assessmentId;
    });

    upsertAssessment();
    return this.findWithItems(decisionId, userId)!;
  },

  lock(decisionId: number, userId: UserId): void {
    db.prepare(`
      UPDATE assessments SET status = 'locked', updated_at = datetime('now')
      WHERE decision_id = ? AND user_id = ?
    `).run(decisionId, userId);
  },

  getStatusForDecision(decisionId: number): { a_locked: boolean; b_locked: boolean } {
    const assessmentA = this.findByDecisionAndUser(decisionId, 'A');
    const assessmentB = this.findByDecisionAndUser(decisionId, 'B');
    return {
      a_locked: assessmentA?.status === 'locked',
      b_locked: assessmentB?.status === 'locked',
    };
  },

  areBothLocked(decisionId: number): boolean {
    const status = this.getStatusForDecision(decisionId);
    return status.a_locked && status.b_locked;
  },
};
