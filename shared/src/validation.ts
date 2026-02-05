import { z } from 'zod';
import {
  USERS,
  DECISION_STATUS,
  ASSESSMENT_ITEM_TYPE,
  BURDEN_OPTIONS,
  META_CONCLUSION_TYPES,
  RATINGS,
} from './constants.js';

export const userIdSchema = z.enum(USERS);

export const createDecisionSchema = z.object({
  name: z.string().min(1).max(200),
  period: z.string().min(1).max(100),
  context: z.string().min(1).max(2000),
  financial_scale: z.string().min(1).max(200),
  emotional_impact: z.string().min(1).max(500),
});
export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;

export const updateAssessmentSchema = z.object({
  rating: z.number().int().min(1).max(5).nullable(),
  would_do_again: z.boolean().nullable(),
  biggest_ignored_risk: z.string().max(1000).nullable(),
  items: z.array(
    z.object({
      type: z.enum(ASSESSMENT_ITEM_TYPE),
      text: z.string().min(1).max(500),
      sort_order: z.number().int().min(0),
    })
  ),
});
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;

export const updateResponsibilitySchema = z.object({
  brought_topic: z.enum(BURDEN_OPTIONS).nullable(),
  pushed_execution: z.enum(BURDEN_OPTIONS).nullable(),
  main_burden: z.enum(BURDEN_OPTIONS).nullable(),
});
export type UpdateResponsibilityInput = z.infer<typeof updateResponsibilitySchema>;

export const updateConclusionSchema = z.object({
  text: z.string().min(1).max(5000),
});
export type UpdateConclusionInput = z.infer<typeof updateConclusionSchema>;

export const createMetaConclusionSchema = z.object({
  type: z.enum(META_CONCLUSION_TYPES),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
});
export type CreateMetaConclusionInput = z.infer<typeof createMetaConclusionSchema>;

export const updateMetaConclusionSchema = createMetaConclusionSchema.partial();
export type UpdateMetaConclusionInput = z.infer<typeof updateMetaConclusionSchema>;

// Lock validation: check completeness
export function validateAssessmentComplete(
  rating: number | null,
  would_do_again: boolean | null,
  biggest_ignored_risk: string | null,
  prosCount: number,
  consCount: number
): string[] {
  const errors: string[] = [];
  if (rating === null) errors.push('Ocena jest wymagana');
  if (would_do_again === null) errors.push('Odpowiedź "czy zrobiłbym to ponownie" jest wymagana');
  if (!biggest_ignored_risk) errors.push('Największe zignorowane ryzyko jest wymagane');
  if (prosCount === 0) errors.push('Wymagany jest co najmniej jeden argument za');
  if (consCount === 0) errors.push('Wymagany jest co najmniej jeden argument przeciw');
  return errors;
}
