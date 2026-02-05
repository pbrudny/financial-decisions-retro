import { Router, Request, Response, NextFunction } from 'express';
import { conclusionsRepo } from '../repositories/conclusionsRepo.js';
import { assessmentsRepo } from '../repositories/assessmentsRepo.js';
import { updateConclusionSchema, createMetaConclusionSchema, updateMetaConclusionSchema } from 'shared';
import { AppError } from '../middleware/errorHandler.js';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// Shared conclusion for a decision
router.get('/decisions/:id/conclusion', asyncHandler(async (req, res) => {
  const decisionId = Number(req.params.id);
  if (!assessmentsRepo.areBothLocked(decisionId)) {
    throw new AppError(403, 'Obie oceny muszą być zablokowane');
  }
  const result = conclusionsRepo.findByDecisionId(decisionId);
  res.json(result ?? null);
}));

router.put('/decisions/:id/conclusion', asyncHandler(async (req, res) => {
  const decisionId = Number(req.params.id);
  if (!assessmentsRepo.areBothLocked(decisionId)) {
    throw new AppError(403, 'Obie oceny muszą być zablokowane');
  }
  const input = updateConclusionSchema.parse(req.body);
  const result = conclusionsRepo.upsertShared(decisionId, input.text);
  res.json(result);
}));

// Meta conclusions (global)
router.get('/meta-conclusions', asyncHandler(async (_req, res) => {
  res.json(conclusionsRepo.findAllMeta());
}));

router.post('/meta-conclusions', asyncHandler(async (req, res) => {
  const input = createMetaConclusionSchema.parse(req.body);
  const result = conclusionsRepo.createMeta(input);
  res.status(201).json(result);
}));

router.put('/meta-conclusions/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = conclusionsRepo.findMetaById(id);
  if (!existing) throw new AppError(404, 'Meta-wniosek nie znaleziony');
  const input = updateMetaConclusionSchema.parse(req.body);
  const result = conclusionsRepo.updateMeta(id, input);
  res.json(result);
}));

router.delete('/meta-conclusions/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = conclusionsRepo.findMetaById(id);
  if (!existing) throw new AppError(404, 'Meta-wniosek nie znaleziony');
  conclusionsRepo.deleteMeta(id);
  res.status(204).end();
}));

export default router;
