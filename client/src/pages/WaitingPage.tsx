import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAssessmentStatus, getDecision } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export function WaitingPage() {
  const { id } = useParams<{ id: string }>();
  const decisionId = Number(id);
  const navigate = useNavigate();
  const { userId } = useAuth();

  const { data: decision } = useQuery({
    queryKey: ['decision', id],
    queryFn: () => getDecision(decisionId),
  });

  const { data: status } = useQuery({
    queryKey: ['assessment-status', decisionId],
    queryFn: () => getAssessmentStatus(decisionId),
    refetchInterval: 3000,
  });

  // Auto redirect when both locked
  useEffect(() => {
    if (status?.a_locked && status?.b_locked) {
      navigate(`/decisions/${decisionId}/compare`);
    }
  }, [status, decisionId, navigate]);

  const myLocked = userId === 'A' ? status?.a_locked : status?.b_locked;
  const partnerLocked = userId === 'A' ? status?.b_locked : status?.a_locked;

  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Oczekiwanie na drugą osobę
        </h1>
        {decision && (
          <p className="text-gray-500 mt-1">{decision.name}</p>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-center gap-8">
          <StatusDot label="Twoja ocena" locked={myLocked ?? false} />
          <StatusDot label="Druga osoba" locked={partnerLocked ?? false} />
        </div>
      </div>

      <p className="text-sm text-gray-400">
        Strona sprawdza status automatycznie co 3 sekundy
      </p>

      <div className="mt-8">
        <Link to="/decisions" className="text-sm text-blue-600 hover:text-blue-800">
          &larr; Powrót do listy decyzji
        </Link>
      </div>
    </div>
  );
}

function StatusDot({ label, locked }: { label: string; locked: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-4 h-4 rounded-full ${locked ? 'bg-green-500' : 'bg-gray-300 animate-pulse'}`} />
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-xs text-gray-400">{locked ? 'Zablokowana' : 'Oczekuje...'}</span>
    </div>
  );
}
