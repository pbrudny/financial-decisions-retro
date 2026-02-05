import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getDecisions, approveDecision, getAssessmentStatus } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { DECISION_STATUS_LABELS } from '../lib/labels';
import { cn } from '../lib/cn';
import type { Decision } from 'shared';
import { useState } from 'react';

export function DecisionListPage() {
  const { data: decisions, isLoading } = useQuery({
    queryKey: ['decisions'],
    queryFn: getDecisions,
  });

  if (isLoading) return <Loading />;

  const proposals = decisions?.filter(d => d.status === 'proposal') ?? [];
  const approved = decisions?.filter(d => d.status === 'approved') ?? [];
  const closed = decisions?.filter(d => d.status === 'closed') ?? [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Decyzje</h1>
        <Link
          to="/decisions/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nowa decyzja
        </Link>
      </div>

      {proposals.length > 0 && (
        <Section title="Propozycje" badge={proposals.length}>
          {proposals.map(d => <DecisionCard key={d.id} decision={d} />)}
        </Section>
      )}

      {approved.length > 0 && (
        <Section title="Zatwierdzone" badge={approved.length}>
          {approved.map(d => <DecisionCard key={d.id} decision={d} />)}
        </Section>
      )}

      {closed.length > 0 && (
        <Section title="Zamknięte" badge={closed.length}>
          {closed.map(d => <DecisionCard key={d.id} decision={d} />)}
        </Section>
      )}

      {decisions?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Brak decyzji</p>
          <p className="text-sm mt-1">Dodaj pierwszą decyzję, aby rozpocząć retrospektywę</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, badge, children }: { title: string; badge: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">{badge}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DecisionCard({ decision }: { decision: Decision }) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [showApproval, setShowApproval] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => approveDecision(decision.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
      setShowApproval(false);
    },
  });

  const isProposal = decision.status === 'proposal';
  const myApproval = userId === 'A' ? decision.approved_by_a : decision.approved_by_b;
  const canApprove = isProposal && !myApproval;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="flex justify-between items-start">
        <Link to={`/decisions/${decision.id}`} className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{decision.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{decision.period} · {decision.financial_scale}</p>
        </Link>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <StatusBadge status={decision.status} />
          {decision.status === 'approved' && (
            <AssessmentStatusBadge decisionId={decision.id} />
          )}
          {canApprove && (
            <button
              onClick={() => setShowApproval(true)}
              className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 font-medium"
            >
              Zatwierdź
            </button>
          )}
        </div>
      </div>
      {showApproval && (
        <div className="mt-3 p-3 bg-yellow-50 rounded-md border border-yellow-200">
          <p className="text-sm text-yellow-800 mb-2">
            Czy potwierdzasz, że ta decyzja rzeczywiście miała miejsce?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Tak, zatwierdzam
            </button>
            <button
              onClick={() => setShowApproval(false)}
              className="px-3 py-1 text-sm bg-white text-gray-600 rounded-md border hover:bg-gray-50"
            >
              Anuluj
            </button>
          </div>
          {approveMutation.isError && (
            <p className="text-sm text-red-600 mt-2">{(approveMutation.error as Error).message}</p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    proposal: 'bg-yellow-50 text-yellow-700',
    approved: 'bg-green-50 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', colors[status] ?? 'bg-gray-100 text-gray-600')}>
      {DECISION_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function AssessmentStatusBadge({ decisionId }: { decisionId: number }) {
  const { data } = useQuery({
    queryKey: ['assessment-status', decisionId],
    queryFn: () => getAssessmentStatus(decisionId),
    refetchInterval: 10000,
  });

  if (!data) return null;

  if (data.a_locked && data.b_locked) {
    return (
      <Link
        to={`/decisions/${decisionId}/compare`}
        className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
      >
        Porównaj
      </Link>
    );
  }

  const count = (data.a_locked ? 1 : 0) + (data.b_locked ? 1 : 0);
  return (
    <span className="text-xs text-gray-400">{count}/2 zablokowane</span>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );
}
