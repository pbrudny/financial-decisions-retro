import { Router, Request, Response, NextFunction } from 'express';
import { decisionsRepo } from '../repositories/decisionsRepo.js';
import { createDecisionSchema } from 'shared';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

router.get('/', asyncHandler(async (_req, res) => {
  const decisions = decisionsRepo.findAll();
  res.json(decisions);
}));

router.post('/', asyncHandler(async (req, res) => {
  const input = createDecisionSchema.parse(req.body);
  const decision = decisionsRepo.create(input, req.userId);
  // Auto-approve by the creator
  decisionsRepo.approve(decision.id, req.userId);
  res.status(201).json(decisionsRepo.findById(decision.id));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const decision = decisionsRepo.findById(Number(req.params.id));
  if (!decision) throw new AppError(404, 'Decyzja nie znaleziona');
  res.json(decision);
}));

router.post('/:id/approve', asyncHandler(async (req, res) => {
  const decision = decisionsRepo.findById(Number(req.params.id));
  if (!decision) throw new AppError(404, 'Decyzja nie znaleziona');
  if (decision.status !== 'proposal') throw new AppError(400, 'Decyzja nie jest propozycją');
  decisionsRepo.approve(decision.id, req.userId);
  res.json(decisionsRepo.findById(decision.id));
}));

router.post('/:id/close', asyncHandler(async (req, res) => {
  const decision = decisionsRepo.findById(Number(req.params.id));
  if (!decision) throw new AppError(404, 'Decyzja nie znaleziona');
  if (decision.status !== 'approved') throw new AppError(400, 'Tylko zatwierdzone decyzje mogą być zamknięte');
  decisionsRepo.close(decision.id);
  res.json(decisionsRepo.findById(decision.id));
}));

export default router;
