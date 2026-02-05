import { vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import supertest from 'supertest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationSQL = readFileSync(join(__dirname, '..', 'db', 'migration.sql'), 'utf-8');

let testDb: Database.Database;

vi.mock('../db/connection.js', () => ({
  default: new Proxy({} as Database.Database, {
    get(_target, prop) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (testDb as any)[prop];
    },
  }),
}));

beforeEach(() => {
  testDb = new Database(':memory:');
  testDb.pragma('foreign_keys = ON');
  testDb.exec(migrationSQL);
});

afterEach(() => {
  testDb.close();
});

export function getApp() {
  // Dynamic import to pick up the mocked db
  return import('../createApp.js').then(m => supertest(m.createApp()));
}

export function asUser(userId: 'A' | 'B') {
  return getApp().then(app => ({
    get: (url: string) => app.get(url).set('X-User-Id', userId),
    post: (url: string) => app.post(url).set('X-User-Id', userId),
    put: (url: string) => app.put(url).set('X-User-Id', userId),
    delete: (url: string) => app.delete(url).set('X-User-Id', userId),
  }));
}

export const validDecision = {
  name: 'Test Decision',
  period: '2024 Q1',
  context: 'Test context for decision',
  financial_scale: '10000 PLN',
  emotional_impact: 'Medium stress',
};

export const fullAssessment = {
  rating: 4,
  would_do_again: true,
  biggest_ignored_risk: 'Market volatility',
  items: [
    { type: 'pro' as const, text: 'Good returns', sort_order: 0 },
    { type: 'con' as const, text: 'High risk', sort_order: 0 },
  ],
};

export const fullResponsibility = {
  brought_topic: 'me' as const,
  pushed_execution: 'both' as const,
  main_burden: 'partner' as const,
};

/** Creates an approved decision and returns its id */
export async function createApprovedDecision(): Promise<number> {
  const a = await asUser('A');
  const res = await a.post('/api/decisions').send(validDecision);
  const id = res.body.id;
  const b = await asUser('B');
  await b.post(`/api/decisions/${id}/approve`);
  return id;
}

/** Fills and locks assessment for a user */
export async function lockAssessment(userId: 'A' | 'B', decisionId: number) {
  const user = await asUser(userId);
  await user.put(`/api/decisions/${decisionId}/assessments/mine`).send(fullAssessment);
  await user.put(`/api/decisions/${decisionId}/responsibilities/mine`).send(fullResponsibility);
  await user.post(`/api/decisions/${decisionId}/assessments/mine/lock`);
}
