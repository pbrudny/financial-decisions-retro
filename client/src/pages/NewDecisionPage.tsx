import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createDecision } from '../api/endpoints';
import type { CreateDecisionInput } from 'shared';

export function NewDecisionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateDecisionInput>({
    name: '',
    period: '',
    context: '',
    financial_scale: '',
    emotional_impact: '',
  });

  const mutation = useMutation({
    mutationFn: () => createDecision(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
      navigate('/decisions');
    },
  });

  const update = (field: keyof CreateDecisionInput, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canSubmit = form.name && form.period && form.context && form.financial_scale && form.emotional_impact;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nowa decyzja</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-5"
      >
        <Field
          label="Nazwa decyzji"
          value={form.name}
          onChange={(v) => update('name', v)}
          placeholder="np. Zakup mieszkania na Mokotowie"
        />
        <Field
          label="Okres"
          value={form.period}
          onChange={(v) => update('period', v)}
          placeholder="np. Marzec - Maj 2024"
        />
        <Field
          label="Kontekst"
          value={form.context}
          onChange={(v) => update('context', v)}
          placeholder="Opisz okoliczności tej decyzji..."
          multiline
        />
        <Field
          label="Skala finansowa"
          value={form.financial_scale}
          onChange={(v) => update('financial_scale', v)}
          placeholder="np. 500 000 PLN"
        />
        <Field
          label="Wpływ emocjonalny"
          value={form.emotional_impact}
          onChange={(v) => update('emotional_impact', v)}
          placeholder="Jak ta decyzja wpłynęła emocjonalnie?"
          multiline
        />

        {mutation.isError && (
          <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!canSubmit || mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? 'Dodawanie...' : 'Dodaj propozycję'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/decisions')}
            className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm font-medium border hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const cls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cls}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}
