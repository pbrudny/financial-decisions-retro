import { Router, Request, Response, NextFunction } from 'express';
import { responsibilitiesRepo } from '../repositories/responsibilitiesRepo.js';
import { assessmentService } from '../services/assessmentService.js';
import { updateResponsibilitySchema } from 'shared';
import { AppError } from '../middleware/errorHandler.js';
import { assessmentsRepo } from '../repositories/assessmentsRepo.js';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const decisionId = (req: Request) => Number(req.params.id);

router.get('/mine', asyncHandler(async (req, res) => {
  const result = responsibilitiesRepo.findByDecisionAndUser(decisionId(req), req.userId);
  res.json(result ?? null);
}));

router.put('/mine', asyncHandler(async (req, res) => {
  const existing = assessmentsRepo.findByDecisionAndUser(decisionId(req), req.userId);
  if (existing?.status === 'locked') throw new AppError(403, 'Ocena jest zablokowana');

  const input = updateResponsibilitySchema.parse(req.body);
  const result = responsibilitiesRepo.upsert(decisionId(req), req.userId, input);
  res.json(result);
}));

router.get('/compare', asyncHandler(async (req, res) => {
  const result = assessmentService.compareResponsibilities(decisionId(req), req.userId);
  res.json(result);
}));

export default router;
