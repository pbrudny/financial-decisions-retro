import { describe, it, expect } from 'vitest';
import { validateAssessmentComplete } from '../validation.js';

describe('validateAssessmentComplete', () => {
  it('returns no errors when all fields are valid', () => {
    const errors = validateAssessmentComplete(4, true, 'Some risk', 1, 1);
    expect(errors).toEqual([]);
  });

  it('returns error when rating is null', () => {
    const errors = validateAssessmentComplete(null, true, 'Risk', 1, 1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Ocena');
  });

  it('returns error when would_do_again is null', () => {
    const errors = validateAssessmentComplete(3, null, 'Risk', 1, 1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('ponownie');
  });

  it('returns error when biggest_ignored_risk is null', () => {
    const errors = validateAssessmentComplete(3, false, null, 1, 1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('ryzyko');
  });

  it('returns error when biggest_ignored_risk is empty string', () => {
    const errors = validateAssessmentComplete(3, false, '', 1, 1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('ryzyko');
  });

  it('returns error when prosCount is 0', () => {
    const errors = validateAssessmentComplete(3, true, 'Risk', 0, 1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('za');
  });

  it('returns error when consCount is 0', () => {
    const errors = validateAssessmentComplete(3, true, 'Risk', 1, 0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('przeciw');
  });

  it('returns all errors when everything is missing', () => {
    const errors = validateAssessmentComplete(null, null, null, 0, 0);
    expect(errors).toHaveLength(5);
  });

  it('accepts would_do_again as false', () => {
    const errors = validateAssessmentComplete(1, false, 'Risk', 1, 1);
    expect(errors).toEqual([]);
  });

  it('accepts minimum valid rating of 1', () => {
    const errors = validateAssessmentComplete(1, true, 'Risk', 1, 1);
    expect(errors).toEqual([]);
  });

  it('accepts maximum valid rating of 5', () => {
    const errors = validateAssessmentComplete(5, true, 'Risk', 1, 1);
    expect(errors).toEqual([]);
  });
});
