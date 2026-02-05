import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  getDecision,
  compareAssessments,
  compareResponsibilities,
  getConclusion,
  updateConclusion,
  closeDecision,
} from '../api/endpoints';
import { cn } from '../lib/cn';
import { RATING_LABELS, BURDEN_LABELS } from '../lib/labels';
import type { AssessmentWithItems, ResponsibilityComparison, BurdenOption } from 'shared';

export function ComparisonPage() {
  const { id } = useParams<{ id: string }>();
  const decisionId = Number(id);
  const queryClient = useQueryClient();

  const { data: decision } = useQuery({
    queryKey: ['decision', id],
    queryFn: () => getDecision(decisionId),
  });

  const { data: comparison, isLoading, error } = useQuery({
    queryKey: ['comparison', id],
    queryFn: () => compareAssessments(decisionId),
  });

  const { data: respComparison } = useQuery({
    queryKey: ['resp-comparison', id],
    queryFn: () => compareResponsibilities(decisionId),
  });

  const { data: conclusion } = useQuery({
    queryKey: ['conclusion', id],
    queryFn: () => getConclusion(decisionId),
  });

  const [conclusionText, setConclusionText] = useState('');
  const [conclusionInit, setConclusionInit] = useState(false);

  if (conclusion && !conclusionInit) {
    setConclusionText(conclusion.text);
    setConclusionInit(true);
  }

  const saveConclusionMut = useMutation({
    mutationFn: () => updateConclusion(decisionId, { text: conclusionText }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conclusion', id] }),
  });

  const closeMut = useMutation({
    mutationFn: () => closeDecision(decisionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decision', id] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-red-600">{(error as Error).message}</p>
        <Link to="/decisions" className="text-sm text-blue-600 hover:text-blue-800 mt-4 inline-block">
          &larr; Powrót do listy
        </Link>
      </div>
    );
  }

  if (!comparison) return null;

  const { mine, partner } = comparison;
  const ratingDiff = mine.rating && partner.rating ? Math.abs(mine.rating - partner.rating) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/decisions" className="text-sm text-blue-600 hover:text-blue-800">&larr; Powrót</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">{decision?.name} — Porównanie</h1>
      </div>

      <div className="space-y-8">
        {/* Rating comparison */}
        <ComparisonSection title="Ocena ogólna">
          <div className="grid grid-cols-2 gap-4">
            <RatingCard label="Twoja ocena" rating={mine.rating} />
            <RatingCard label="Druga osoba" rating={partner.rating} />
          </div>
          <DiffBadge diff={ratingDiff} />
        </ComparisonSection>

        {/* Pros comparison */}
        <ComparisonSection title="Argumenty za">
          <div className="grid grid-cols-2 gap-4">
            <ItemList label="Twoje" items={mine.items.filter(i => i.type === 'pro').map(i => i.text)} />
            <ItemList label="Druga osoba" items={partner.items.filter(i => i.type === 'pro').map(i => i.text)} />
          </div>
        </ComparisonSection>

        {/* Cons comparison */}
        <ComparisonSection title="Argumenty przeciw">
          <div className="grid grid-cols-2 gap-4">
            <ItemList label="Twoje" items={mine.items.filter(i => i.type === 'con').map(i => i.text)} />
            <ItemList label="Druga osoba" items={partner.items.filter(i => i.type === 'con').map(i => i.text)} />
          </div>
        </ComparisonSection>

        {/* Would do again */}
        <ComparisonSection title="Czy podjąłbyś ponownie?">
          <div className="grid grid-cols-2 gap-4">
            <BoolCard label="Twoja odpowiedź" value={mine.would_do_again} />
            <BoolCard label="Druga osoba" value={partner.would_do_again} />
          </div>
          {mine.would_do_again !== partner.would_do_again && (
            <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-700 text-center">
              Rozbieżność — warto o tym porozmawiać
            </div>
          )}
        </ComparisonSection>

        {/* Risk comparison */}
        <ComparisonSection title="Największe zignorowane ryzyko">
          <div className="grid grid-cols-2 gap-4">
            <TextCard label="Twoje" text={mine.biggest_ignored_risk} />
            <TextCard label="Druga osoba" text={partner.biggest_ignored_risk} />
          </div>
        </ComparisonSection>

        {/* Responsibility comparison */}
        {respComparison && (
          <ComparisonSection title="Odpowiedzialność">
            <ResponsibilityCompare data={respComparison} />
          </ComparisonSection>
        )}

        {/* Shared conclusion */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Wspólny wniosek</h2>
          <textarea
            value={conclusionText}
            onChange={(e) => setConclusionText(e.target.value)}
            placeholder="Wspólny wniosek z tej decyzji..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => saveConclusionMut.mutate()}
              disabled={!conclusionText.trim() || saveConclusionMut.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saveConclusionMut.isPending ? 'Zapisywanie...' : 'Zapisz wniosek'}
            </button>
            {decision?.status === 'approved' && (
              <button
                onClick={() => closeMut.mutate()}
                disabled={closeMut.isPending}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Zamknij decyzję
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function RatingCard({ label, rating }: { label: string; rating: number | null }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-3xl font-bold text-gray-900">{rating ?? '—'}</div>
      {rating && <div className="text-xs text-gray-400 mt-1">{RATING_LABELS[rating]}</div>}
    </div>
  );
}

function DiffBadge({ diff }: { diff: number }) {
  const color = diff >= 2 ? 'bg-red-50 text-red-700' : diff === 1 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700';
  const text = diff >= 2 ? 'Duża rozbieżność' : diff === 1 ? 'Mała rozbieżność' : 'Zgodność';
  return (
    <div className={cn('mt-3 p-2 rounded text-sm text-center font-medium', color)}>
      {text} (różnica: {diff})
    </div>
  );
}

function ItemList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-1.5">{item}</li>
        ))}
        {items.length === 0 && <li className="text-sm text-gray-400">Brak</li>}
      </ul>
    </div>
  );
}

function BoolCard({ label, value }: { label: string; value: boolean | number | null }) {
  const boolVal = value === null || value === undefined ? null : Boolean(value);
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-semibold">
        {boolVal === null ? '—' : boolVal ? 'Tak' : 'Nie'}
      </div>
    </div>
  );
}

function TextCard({ label, text }: { label: string; text: string | null }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <p className="text-sm text-gray-700 bg-gray-50 rounded p-3">{text || '—'}</p>
    </div>
  );
}

function ResponsibilityCompare({ data }: { data: ResponsibilityComparison }) {
  const fields: { label: string; key: 'brought_topic' | 'pushed_execution' | 'main_burden' }[] = [
    { label: 'Kto zainicjował temat?', key: 'brought_topic' },
    { label: 'Kto pchał realizację?', key: 'pushed_execution' },
    { label: 'Główny ciężar', key: 'main_burden' },
  ];

  return (
    <div className="space-y-3">
      {fields.map(({ label, key }) => {
        const mineVal = data.mine[key] as BurdenOption | null;
        const partnerVal = data.partner[key] as BurdenOption | null;
        const match = mineVal === partnerVal;
        return (
          <div key={key}>
            <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded px-3 py-2 text-sm text-center">
                <span className="text-xs text-gray-400 block">Twoja</span>
                {mineVal ? BURDEN_LABELS[mineVal] : '—'}
              </div>
              <div className="bg-gray-50 rounded px-3 py-2 text-sm text-center">
                <span className="text-xs text-gray-400 block">Druga osoba</span>
                {partnerVal ? BURDEN_LABELS[partnerVal] : '—'}
              </div>
            </div>
            {!match && mineVal && partnerVal && (
              <div className="text-xs text-yellow-600 mt-1 text-center">Różne postrzeganie</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
