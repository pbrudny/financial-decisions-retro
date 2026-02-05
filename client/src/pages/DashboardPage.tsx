import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/endpoints';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Wszystkie decyzje" value={data.total_decisions} />
        <StatCard label="Zatwierdzone" value={data.approved_decisions} />
        <StatCard label="Ocenione" value={data.rating_diffs.length} />
        <StatCard label="Meta-wnioski" value={data.meta_counts.reduce((s: number, c: any) => s + c.count, 0)} />
      </div>

      {/* Rating distribution */}
      {data.ratings.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Rozkład ocen</h2>
          <div className="flex items-end gap-3 h-32">
            {[1, 2, 3, 4, 5].map(r => {
              const count = data.ratings.find((x: any) => x.rating === r)?.count ?? 0;
              const max = Math.max(...data.ratings.map((x: any) => x.count), 1);
              const height = max > 0 ? (count / max) * 100 : 0;
              return (
                <div key={r} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{count}</span>
                  <div
                    className="w-full bg-blue-200 rounded-t transition-all"
                    style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-gray-600 font-medium">{r}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rating diffs */}
      {data.rating_diffs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Porównanie ocen</h2>
          <div className="space-y-2">
            {data.rating_diffs.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-gray-700 truncate">{d.name}</span>
                <span className="text-gray-500">A: {d.rating_a}</span>
                <span className="text-gray-500">B: {d.rating_b}</span>
                <DiffBadge diff={d.diff} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Would do again */}
      {data.would_do_again.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Czy podjąłbyś ponownie?</h2>
          <div className="flex gap-4">
            {data.would_do_again.map((w: any) => (
              <div key={w.would_do_again} className="flex-1 bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{w.count}</div>
                <div className="text-sm text-gray-500">{w.would_do_again ? 'Tak' : 'Nie'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.total_decisions === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Brak danych</p>
          <p className="text-sm mt-1">Dodaj decyzje i wypełnij oceny, aby zobaczyć statystyki</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function DiffBadge({ diff }: { diff: number }) {
  const cls = diff >= 2 ? 'bg-red-50 text-red-700' : diff === 1 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {diff === 0 ? '=' : `+${diff}`}
    </span>
  );
}
