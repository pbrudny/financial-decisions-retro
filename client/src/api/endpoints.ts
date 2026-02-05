import { apiFetch } from './client';
import type {
  Decision,
  AssessmentWithItems,
  Responsibility,
  SharedConclusion,
  MetaConclusion,
  ComparisonData,
  ResponsibilityComparison,
  GlobalStatus,
  CreateDecisionInput,
  UpdateAssessmentInput,
  UpdateResponsibilityInput,
  UpdateConclusionInput,
  CreateMetaConclusionInput,
  UpdateMetaConclusionInput,
} from 'shared';

// Decisions
export const getDecisions = () => apiFetch<Decision[]>('/decisions');
export const getDecision = (id: number) => apiFetch<Decision>(`/decisions/${id}`);
export const createDecision = (input: CreateDecisionInput) =>
  apiFetch<Decision>('/decisions', { method: 'POST', body: JSON.stringify(input) });
export const approveDecision = (id: number) =>
  apiFetch<Decision>(`/decisions/${id}/approve`, { method: 'POST' });
export const closeDecision = (id: number) =>
  apiFetch<Decision>(`/decisions/${id}/close`, { method: 'POST' });

// Assessments
export const getMyAssessment = (decisionId: number) =>
  apiFetch<AssessmentWithItems | null>(`/decisions/${decisionId}/assessments/mine`);
export const updateMyAssessment = (decisionId: number, input: UpdateAssessmentInput) =>
  apiFetch<AssessmentWithItems>(`/decisions/${decisionId}/assessments/mine`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
export const lockMyAssessment = (decisionId: number) =>
  apiFetch<{ locked: boolean }>(`/decisions/${decisionId}/assessments/mine/lock`, { method: 'POST' });
export const getAssessmentStatus = (decisionId: number) =>
  apiFetch<{ a_locked: boolean; b_locked: boolean }>(`/decisions/${decisionId}/assessments/status`);
export const compareAssessments = (decisionId: number) =>
  apiFetch<ComparisonData>(`/decisions/${decisionId}/assessments/compare`);

// Responsibilities
export const getMyResponsibility = (decisionId: number) =>
  apiFetch<Responsibility | null>(`/decisions/${decisionId}/responsibilities/mine`);
export const updateMyResponsibility = (decisionId: number, input: UpdateResponsibilityInput) =>
  apiFetch<Responsibility>(`/decisions/${decisionId}/responsibilities/mine`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
export const compareResponsibilities = (decisionId: number) =>
  apiFetch<ResponsibilityComparison>(`/decisions/${decisionId}/responsibilities/compare`);

// Conclusions
export const getConclusion = (decisionId: number) =>
  apiFetch<SharedConclusion | null>(`/decisions/${decisionId}/conclusion`);
export const updateConclusion = (decisionId: number, input: UpdateConclusionInput) =>
  apiFetch<SharedConclusion>(`/decisions/${decisionId}/conclusion`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

// Meta conclusions
export const getMetaConclusions = () => apiFetch<MetaConclusion[]>('/meta-conclusions');
export const createMetaConclusion = (input: CreateMetaConclusionInput) =>
  apiFetch<MetaConclusion>('/meta-conclusions', { method: 'POST', body: JSON.stringify(input) });
export const updateMetaConclusion = (id: number, input: UpdateMetaConclusionInput) =>
  apiFetch<MetaConclusion>(`/meta-conclusions/${id}`, { method: 'PUT', body: JSON.stringify(input) });
export const deleteMetaConclusion = (id: number) =>
  apiFetch<void>(`/meta-conclusions/${id}`, { method: 'DELETE' });

// Status
export const getGlobalStatus = () => apiFetch<GlobalStatus>('/status');
export const getDashboardStats = () => apiFetch<any>('/status/dashboard');
