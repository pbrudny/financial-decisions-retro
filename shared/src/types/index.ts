import type {
  UserId,
  DecisionStatus,
  AssessmentStatus,
  AssessmentItemType,
  BurdenOption,
  MetaConclusionType,
  Rating,
} from '../constants.js';

export interface Decision {
  id: number;
  name: string;
  period: string;
  context: string;
  financial_scale: string;
  emotional_impact: string;
  status: DecisionStatus;
  approved_by_a: boolean;
  approved_by_b: boolean;
  created_by: UserId;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: number;
  decision_id: number;
  user_id: UserId;
  rating: Rating | null;
  would_do_again: boolean | null;
  biggest_ignored_risk: string | null;
  status: AssessmentStatus;
  created_at: string;
  updated_at: string;
}

export interface AssessmentItem {
  id: number;
  assessment_id: number;
  type: AssessmentItemType;
  text: string;
  sort_order: number;
}

export interface Responsibility {
  id: number;
  decision_id: number;
  user_id: UserId;
  brought_topic: BurdenOption | null;
  pushed_execution: BurdenOption | null;
  main_burden: BurdenOption | null;
  created_at: string;
  updated_at: string;
}

export interface SharedConclusion {
  id: number;
  decision_id: number;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface MetaConclusion {
  id: number;
  type: MetaConclusionType;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentWithItems extends Assessment {
  items: AssessmentItem[];
}

export interface ComparisonData {
  mine: AssessmentWithItems;
  partner: AssessmentWithItems;
}

export interface ResponsibilityComparison {
  mine: Responsibility;
  partner: Responsibility;
}

export interface GlobalStatus {
  total_decisions: number;
  approved_decisions: number;
  closed_decisions: number;
  partner_last_seen: string | null;
}
