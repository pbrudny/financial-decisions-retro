import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getDecision } from '../api/endpoints';
import { DECISION_STATUS_LABELS } from '../lib/labels';

export function DecisionContextPage() {
  const { id } = useParams<{ id: string }>();
  const { data: decision, isLoading } = useQuery({
    queryKey: ['decision', id],
    queryFn: () => getDecision(Number(id)),
  });

  if (isLoading || !decision) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/decisions" className="text-sm text-blue-600 hover:text-blue-800">&larr; Powrót do listy</Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{decision.name}</h1>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {DECISION_STATUS_LABELS[decision.status]}
          </span>
        </div>

        <div className="space-y-4">
          <InfoRow label="Okres" value={decision.period} />
          <InfoRow label="Skala finansowa" value={decision.financial_scale} />
          <InfoRow label="Wpływ emocjonalny" value={decision.emotional_impact} />
          <div>
            <span className="text-sm font-medium text-gray-500">Kontekst</span>
            <p className="text-gray-800 mt-1 whitespace-pre-wrap">{decision.context}</p>
          </div>
        </div>

        {decision.status === 'approved' && (
          <div className="mt-6 pt-4 border-t">
            <Link
              to={`/decisions/${decision.id}/assess`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-block"
            >
              Przejdź do oceny
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <p className="text-gray-800">{value}</p>
    </div>
  );
}
