export const USERS = ['A', 'B'] as const;
export type UserId = (typeof USERS)[number];

export const DECISION_STATUS = ['proposal', 'approved', 'closed'] as const;
export type DecisionStatus = (typeof DECISION_STATUS)[number];

export const ASSESSMENT_STATUS = ['editable', 'locked'] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUS)[number];

export const ASSESSMENT_ITEM_TYPE = ['pro', 'con'] as const;
export type AssessmentItemType = (typeof ASSESSMENT_ITEM_TYPE)[number];

export const BURDEN_OPTIONS = ['me', 'partner', 'both', 'dont_remember'] as const;
export type BurdenOption = (typeof BURDEN_OPTIONS)[number];

export const META_CONCLUSION_TYPES = ['bias', 'rule', 'red_flag'] as const;
export type MetaConclusionType = (typeof META_CONCLUSION_TYPES)[number];

export const RATINGS = [1, 2, 3, 4, 5] as const;
export type Rating = (typeof RATINGS)[number];
