import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getGlobalStatus } from '../api/endpoints';
import type { UserId } from 'shared';

export function StartScreen() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Retrospektywa Decyzji Finansowych
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Wybierz swoją osobę, aby rozpocząć
        </p>

        <div className="grid grid-cols-2 gap-4">
          {(['A', 'B'] as UserId[]).map((id) => (
            <button
              key={id}
              onClick={() => login(id)}
              className="flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                {id}
              </div>
              <span className="text-sm font-medium text-gray-700">Osoba {id}</span>
            </button>
          ))}
        </div>

        <PartnerStatus />
      </div>
    </div>
  );
}

function PartnerStatus() {
  // We try to fetch status but won't have auth header - that's ok, just show nothing
  const { data } = useQuery({
    queryKey: ['status'],
    queryFn: getGlobalStatus,
    retry: false,
    refetchInterval: 5000,
  });

  if (!data?.partner_last_seen) return null;

  const lastSeen = new Date(data.partner_last_seen);
  const diffMs = Date.now() - lastSeen.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  const statusText = diffMin < 1
    ? 'Aktywna teraz'
    : diffMin < 60
      ? `Aktywna ${diffMin} min temu`
      : 'Nieaktywna';

  return (
    <p className="text-center text-sm text-gray-400 mt-6">
      Druga osoba: {statusText}
    </p>
  );
}
