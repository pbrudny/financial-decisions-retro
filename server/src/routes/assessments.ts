import { Router, Request, Response, NextFunction } from 'express';
import { assessmentService } from '../services/assessmentService.js';
import { updateAssessmentSchema } from 'shared';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const decisionId = (req: Request) => Number(req.params.id);

router.get('/mine', asyncHandler(async (req, res) => {
  const result = assessmentService.getMine(decisionId(req), req.userId);
  res.json(result);
}));

router.put('/mine', asyncHandler(async (req, res) => {
  const input = updateAssessmentSchema.parse(req.body);
  const result = assessmentService.updateMine(decisionId(req), req.userId, input);
  res.json(result);
}));

router.post('/mine/lock', asyncHandler(async (req, res) => {
  const result = assessmentService.lockMine(decisionId(req), req.userId);
  res.json(result);
}));

router.get('/status', asyncHandler(async (req, res) => {
  const result = assessmentService.getStatus(decisionId(req));
  res.json(result);
}));

router.get('/compare', asyncHandler(async (req, res) => {
  const result = assessmentService.compare(decisionId(req), req.userId);
  res.json(result);
}));

export default router;
