import db from '../db/connection.js';
import type { Decision, UserId, CreateDecisionInput } from 'shared';

export const decisionsRepo = {
  findAll(): Decision[] {
    return db.prepare('SELECT * FROM decisions ORDER BY created_at DESC').all() as Decision[];
  },

  findById(id: number): Decision | undefined {
    return db.prepare('SELECT * FROM decisions WHERE id = ?').get(id) as Decision | undefined;
  },

  create(input: CreateDecisionInput, createdBy: UserId): Decision {
    const stmt = db.prepare(`
      INSERT INTO decisions (name, period, context, financial_scale, emotional_impact, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      input.name,
      input.period,
      input.context,
      input.financial_scale,
      input.emotional_impact,
      createdBy
    );
    return this.findById(result.lastInsertRowid as number)!;
  },

  approve(id: number, userId: UserId): void {
    const column = userId === 'A' ? 'approved_by_a' : 'approved_by_b';
    db.prepare(`UPDATE decisions SET ${column} = 1, updated_at = datetime('now') WHERE id = ?`).run(id);

    // Auto-transition to approved when both approve
    const decision = this.findById(id)!;
    if (decision.approved_by_a && decision.approved_by_b && decision.status === 'proposal') {
      db.prepare(`UPDATE decisions SET status = 'approved', updated_at = datetime('now') WHERE id = ?`).run(id);
    }
  },

  close(id: number): void {
    db.prepare(`UPDATE decisions SET status = 'closed', updated_at = datetime('now') WHERE id = ?`).run(id);
  },

  countByStatus(): { total: number; approved: number; closed: number } {
    const rows = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
      FROM decisions
    `).get() as any;
    return { total: rows.total ?? 0, approved: rows.approved ?? 0, closed: rows.closed ?? 0 };
  },
};
