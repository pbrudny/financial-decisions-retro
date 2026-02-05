import db from '../db/connection.js';
import type { SharedConclusion, MetaConclusion, CreateMetaConclusionInput, UpdateMetaConclusionInput } from 'shared';

export const conclusionsRepo = {
  findByDecisionId(decisionId: number): SharedConclusion | undefined {
    return db.prepare(
      'SELECT * FROM shared_conclusions WHERE decision_id = ?'
    ).get(decisionId) as SharedConclusion | undefined;
  },

  upsertShared(decisionId: number, text: string): SharedConclusion {
    const existing = this.findByDecisionId(decisionId);

    if (existing) {
      db.prepare(`
        UPDATE shared_conclusions SET text = ?, updated_at = datetime('now') WHERE id = ?
      `).run(text, existing.id);
    } else {
      db.prepare(`
        INSERT INTO shared_conclusions (decision_id, text) VALUES (?, ?)
      `).run(decisionId, text);
    }

    return this.findByDecisionId(decisionId)!;
  },

  findAllMeta(): MetaConclusion[] {
    return db.prepare('SELECT * FROM meta_conclusions ORDER BY created_at DESC').all() as MetaConclusion[];
  },

  findMetaById(id: number): MetaConclusion | undefined {
    return db.prepare('SELECT * FROM meta_conclusions WHERE id = ?').get(id) as MetaConclusion | undefined;
  },

  createMeta(input: CreateMetaConclusionInput): MetaConclusion {
    const result = db.prepare(`
      INSERT INTO meta_conclusions (type, title, description) VALUES (?, ?, ?)
    `).run(input.type, input.title, input.description);
    return this.findMetaById(result.lastInsertRowid as number)!;
  },

  updateMeta(id: number, input: UpdateMetaConclusionInput): MetaConclusion {
    const existing = this.findMetaById(id)!;
    db.prepare(`
      UPDATE meta_conclusions
      SET type = ?, title = ?, description = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      input.type ?? existing.type,
      input.title ?? existing.title,
      input.description ?? existing.description,
      id
    );
    return this.findMetaById(id)!;
  },

  deleteMeta(id: number): void {
    db.prepare('DELETE FROM meta_conclusions WHERE id = ?').run(id);
  },
};
