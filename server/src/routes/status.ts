import { Router, Request, Response, NextFunction } from 'express';
import { decisionsRepo } from '../repositories/decisionsRepo.js';
import db from '../db/connection.js';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// Track last seen per user
const lastSeen: Record<string, string> = {};

router.get('/', asyncHandler(async (req, res) => {
  const partner = req.userId === 'A' ? 'B' : 'A';

  // Update current user's last seen
  lastSeen[req.userId] = new Date().toISOString();

  const counts = decisionsRepo.countByStatus();

  res.json({
    total_decisions: counts.total,
    approved_decisions: counts.approved,
    closed_decisions: counts.closed,
    partner_last_seen: lastSeen[partner] ?? null,
  });
}));

// Dashboard stats
router.get('/dashboard', asyncHandler(async (req, res) => {
  const decisions = decisionsRepo.findAll();
  const approved = decisions.filter(d => d.status === 'approved' || d.status === 'closed');

  // Rating distribution
  const ratings = db.prepare(`
    SELECT rating, COUNT(*) as count FROM assessments
    WHERE rating IS NOT NULL
    GROUP BY rating ORDER BY rating
  `).all() as { rating: number; count: number }[];

  // Would do again stats
  const wouldDoAgain = db.prepare(`
    SELECT would_do_again, COUNT(*) as count FROM assessments
    WHERE would_do_again IS NOT NULL
    GROUP BY would_do_again
  `).all() as { would_do_again: number; count: number }[];

  // Agreement stats (decisions where both locked)
  const comparedDecisions = db.prepare(`
    SELECT d.id, d.name,
      a1.rating as rating_a, a2.rating as rating_b,
      a1.would_do_again as wda_a, a2.would_do_again as wda_b
    FROM decisions d
    JOIN assessments a1 ON a1.decision_id = d.id AND a1.user_id = 'A' AND a1.status = 'locked'
    JOIN assessments a2 ON a2.decision_id = d.id AND a2.user_id = 'B' AND a2.status = 'locked'
  `).all() as { name: string; rating_a: number; rating_b: number; wda_a: number; wda_b: number }[];

  const ratingDiffs = comparedDecisions.map(d => ({
    name: d.name,
    diff: Math.abs(d.rating_a - d.rating_b),
    rating_a: d.rating_a,
    rating_b: d.rating_b,
  }));

  // Meta conclusions count by type
  const metaCounts = db.prepare(`
    SELECT type, COUNT(*) as count FROM meta_conclusions GROUP BY type
  `).all() as { type: string; count: number }[];

  res.json({
    total_decisions: decisions.length,
    approved_decisions: approved.length,
    ratings,
    would_do_again: wouldDoAgain,
    rating_diffs: ratingDiffs,
    meta_counts: metaCounts,
  });
}));

export default router;
