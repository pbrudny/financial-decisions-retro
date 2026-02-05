import { describe, it, expect } from 'vitest';
import {
  userIdSchema,
  createDecisionSchema,
  updateAssessmentSchema,
  updateResponsibilitySchema,
  updateConclusionSchema,
  createMetaConclusionSchema,
  updateMetaConclusionSchema,
} from '../validation.js';

describe('userIdSchema', () => {
  it('accepts A', () => {
    expect(userIdSchema.parse('A')).toBe('A');
  });

  it('accepts B', () => {
    expect(userIdSchema.parse('B')).toBe('B');
  });

  it('rejects C', () => {
    expect(() => userIdSchema.parse('C')).toThrow();
  });

  it('rejects empty string', () => {
    expect(() => userIdSchema.parse('')).toThrow();
  });

  it('rejects lowercase a', () => {
    expect(() => userIdSchema.parse('a')).toThrow();
  });
});

describe('createDecisionSchema', () => {
  const valid = {
    name: 'Decision',
    period: 'Q1 2024',
    context: 'Context',
    financial_scale: '10k',
    emotional_impact: 'High',
  };

  it('accepts valid input', () => {
    expect(createDecisionSchema.parse(valid)).toEqual(valid);
  });

  it('rejects empty name', () => {
    expect(() => createDecisionSchema.parse({ ...valid, name: '' })).toThrow();
  });

  it('rejects missing period', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { period, ...rest } = valid;
    expect(() => createDecisionSchema.parse(rest)).toThrow();
  });

  it('rejects name over 200 chars', () => {
    expect(() => createDecisionSchema.parse({ ...valid, name: 'x'.repeat(201) })).toThrow();
  });

  it('strips extra fields', () => {
    const result = createDecisionSchema.parse({ ...valid, extra: 'ignored' });
    expect(result).not.toHaveProperty('extra');
  });
});

describe('updateAssessmentSchema', () => {
  const valid = {
    rating: 3,
    would_do_again: true,
    biggest_ignored_risk: 'Risk',
    items: [{ type: 'pro' as const, text: 'Good', sort_order: 0 }],
  };

  it('accepts valid input', () => {
    expect(updateAssessmentSchema.parse(valid)).toEqual(valid);
  });

  it('accepts null rating', () => {
    const result = updateAssessmentSchema.parse({ ...valid, rating: null });
    expect(result.rating).toBeNull();
  });

  it('rejects rating of 0', () => {
    expect(() => updateAssessmentSchema.parse({ ...valid, rating: 0 })).toThrow();
  });

  it('rejects rating of 6', () => {
    expect(() => updateAssessmentSchema.parse({ ...valid, rating: 6 })).toThrow();
  });

  it('accepts empty items array', () => {
    const result = updateAssessmentSchema.parse({ ...valid, items: [] });
    expect(result.items).toEqual([]);
  });

  it('rejects invalid item type', () => {
    expect(() =>
      updateAssessmentSchema.parse({
        ...valid,
        items: [{ type: 'neutral', text: 'x', sort_order: 0 }],
      })
    ).toThrow();
  });

  it('rejects item with empty text', () => {
    expect(() =>
      updateAssessmentSchema.parse({
        ...valid,
        items: [{ type: 'pro', text: '', sort_order: 0 }],
      })
    ).toThrow();
  });
});

describe('updateResponsibilitySchema', () => {
  it('accepts all valid burden options', () => {
    for (const opt of ['me', 'partner', 'both', 'dont_remember'] as const) {
      const result = updateResponsibilitySchema.parse({
        brought_topic: opt,
        pushed_execution: opt,
        main_burden: opt,
      });
      expect(result.brought_topic).toBe(opt);
    }
  });

  it('accepts all nulls', () => {
    const result = updateResponsibilitySchema.parse({
      brought_topic: null,
      pushed_execution: null,
      main_burden: null,
    });
    expect(result.brought_topic).toBeNull();
  });

  it('rejects invalid burden option', () => {
    expect(() =>
      updateResponsibilitySchema.parse({
        brought_topic: 'invalid',
        pushed_execution: null,
        main_burden: null,
      })
    ).toThrow();
  });
});

describe('updateConclusionSchema', () => {
  it('accepts valid text', () => {
    expect(updateConclusionSchema.parse({ text: 'Conclusion' })).toEqual({ text: 'Conclusion' });
  });

  it('rejects empty text', () => {
    expect(() => updateConclusionSchema.parse({ text: '' })).toThrow();
  });
});

describe('createMetaConclusionSchema', () => {
  const valid = { type: 'bias' as const, title: 'Title', description: 'Desc' };

  it('accepts valid input', () => {
    expect(createMetaConclusionSchema.parse(valid)).toEqual(valid);
  });

  it('accepts all valid types', () => {
    for (const type of ['bias', 'rule', 'red_flag'] as const) {
      expect(createMetaConclusionSchema.parse({ ...valid, type })).toHaveProperty('type', type);
    }
  });

  it('rejects invalid type', () => {
    expect(() => createMetaConclusionSchema.parse({ ...valid, type: 'other' })).toThrow();
  });
});

describe('updateMetaConclusionSchema', () => {
  it('accepts partial input', () => {
    const result = updateMetaConclusionSchema.parse({ title: 'New title' });
    expect(result).toEqual({ title: 'New title' });
  });

  it('accepts empty object', () => {
    const result = updateMetaConclusionSchema.parse({});
    expect(result).toEqual({});
  });
});
