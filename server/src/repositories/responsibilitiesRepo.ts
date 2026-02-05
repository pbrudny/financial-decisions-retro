import db from '../db/connection.js';
import type { Responsibility, UserId, UpdateResponsibilityInput } from 'shared';

export const responsibilitiesRepo = {
  findByDecisionAndUser(decisionId: number, userId: UserId): Responsibility | undefined {
    return db.prepare(
      'SELECT * FROM responsibilities WHERE decision_id = ? AND user_id = ?'
    ).get(decisionId, userId) as Responsibility | undefined;
  },

  upsert(decisionId: number, userId: UserId, input: UpdateResponsibilityInput): Responsibility {
    const existing = this.findByDecisionAndUser(decisionId, userId);

    if (existing) {
      db.prepare(`
        UPDATE responsibilities
        SET brought_topic = ?, pushed_execution = ?, main_burden = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(input.brought_topic, input.pushed_execution, input.main_burden, existing.id);
    } else {
      db.prepare(`
        INSERT INTO responsibilities (decision_id, user_id, brought_topic, pushed_execution, main_burden)
        VALUES (?, ?, ?, ?, ?)
      `).run(decisionId, userId, input.brought_topic, input.pushed_execution, input.main_burden);
    }

    return this.findByDecisionAndUser(decisionId, userId)!;
  },
};
