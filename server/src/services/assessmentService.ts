import { assessmentsRepo } from '../repositories/assessmentsRepo.js';
import { responsibilitiesRepo } from '../repositories/responsibilitiesRepo.js';
import { decisionsRepo } from '../repositories/decisionsRepo.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateAssessmentComplete, type UserId, type UpdateAssessmentInput } from 'shared';

function getPartner(userId: UserId): UserId {
  return userId === 'A' ? 'B' : 'A';
}

export const assessmentService = {
  getMine(decisionId: number, userId: UserId) {
    const decision = decisionsRepo.findById(decisionId);
    if (!decision) throw new AppError(404, 'Decyzja nie znaleziona');
    return assessmentsRepo.findWithItems(decisionId, userId) ?? null;
  },

  updateMine(decisionId: number, userId: UserId, input: UpdateAssessmentInput) {
    const decision = decisionsRepo.findById(decisionId);
    if (!decision) throw new AppError(404, 'Decyzja nie znaleziona');
    if (decision.status !== 'approved') throw new AppError(400, 'Decyzja musi być zatwierdzona');

    const existing = assessmentsRepo.findByDecisionAndUser(decisionId, userId);
    if (existing?.status === 'locked') throw new AppError(403, 'Ocena jest zablokowana');

    return assessmentsRepo.upsert(decisionId, userId, input);
  },

  lockMine(decisionId: number, userId: UserId) {
    const decision = decisionsRepo.findById(decisionId);
    if (!decision) throw new AppError(404, 'Decyzja nie znaleziona');

    const assessment = assessmentsRepo.findWithItems(decisionId, userId);
    if (!assessment) throw new AppError(404, 'Najpierw wypełnij ocenę');
    if (assessment.status === 'locked') throw new AppError(400, 'Ocena jest już zablokowana');

    const prosCount = assessment.items.filter(i => i.type === 'pro').length;
    const consCount = assessment.items.filter(i => i.type === 'con').length;

    const errors = validateAssessmentComplete(
      assessment.rating,
      assessment.would_do_again === null ? null : Boolean(assessment.would_do_again),
      assessment.biggest_ignored_risk,
      prosCount,
      consCount
    );
    if (errors.length > 0) {
      throw new AppError(400, errors.join('; '));
    }

    // Also check responsibility is filled
    const responsibility = responsibilitiesRepo.findByDecisionAndUser(decisionId, userId);
    if (!responsibility || !responsibility.brought_topic || !responsibility.pushed_execution || !responsibility.main_burden) {
      throw new AppError(400, 'Wypełnij sekcję odpowiedzialności przed zablokowaniem');
    }

    assessmentsRepo.lock(decisionId, userId);
    return { locked: true };
  },

  getStatus(decisionId: number) {
    const decision = decisionsRepo.findById(decisionId);
    if (!decision) throw new AppError(404, 'Decyzja nie znaleziona');
    return assessmentsRepo.getStatusForDecision(decisionId);
  },

  compare(decisionId: number, userId: UserId) {
    const decision = decisionsRepo.findById(decisionId);
    if (!decision) throw new AppError(404, 'Decyzja nie znaleziona');

    const mine = assessmentsRepo.findWithItems(decisionId, userId);
    const partner = assessmentsRepo.findWithItems(decisionId, getPartner(userId));

    if (!mine || !partner) throw new AppError(404, 'Obie oceny muszą istnieć');
    if (mine.status !== 'locked' || partner.status !== 'locked') {
      throw new AppError(403, 'Obie oceny muszą być zablokowane');
    }

    return { mine, partner };
  },

  compareResponsibilities(decisionId: number, userId: UserId) {
    const decision = decisionsRepo.findById(decisionId);
    if (!decision) throw new AppError(404, 'Decyzja nie znaleziona');

    if (!assessmentsRepo.areBothLocked(decisionId)) {
      throw new AppError(403, 'Obie oceny muszą być zablokowane');
    }

    const mine = responsibilitiesRepo.findByDecisionAndUser(decisionId, userId);
    const partner = responsibilitiesRepo.findByDecisionAndUser(decisionId, getPartner(userId));

    if (!mine || !partner) throw new AppError(404, 'Obie odpowiedzialności muszą istnieć');

    return { mine, partner };
  },
};
