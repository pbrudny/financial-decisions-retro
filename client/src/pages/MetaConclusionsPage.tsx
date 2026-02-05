import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMetaConclusions,
  createMetaConclusion,
  updateMetaConclusion,
  deleteMetaConclusion,
} from '../api/endpoints';
import { META_TYPE_LABELS } from '../lib/labels';
import { cn } from '../lib/cn';
import type { MetaConclusion, MetaConclusionType, CreateMetaConclusionInput } from 'shared';
import { META_CONCLUSION_TYPES } from 'shared';

export function MetaConclusionsPage() {
  const queryClient = useQueryClient();
  const { data: conclusions, isLoading } = useQuery({
    queryKey: ['meta-conclusions'],
    queryFn: getMetaConclusions,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateMetaConclusionInput>({
    type: 'bias',
    title: '',
    description: '',
  });

  const createMut = useMutation({
    mutationFn: () => createMetaConclusion(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-conclusions'] });
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: () => updateMetaConclusion(editingId!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-conclusions'] });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteMetaConclusion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meta-conclusions'] }),
  });

  const resetForm = () => {
    setForm({ type: 'bias', title: '', description: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (c: MetaConclusion) => {
    setForm({ type: c.type as MetaConclusionType, title: c.title, description: c.description });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMut.mutate();
    } else {
      createMut.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const grouped = {
    bias: conclusions?.filter(c => c.type === 'bias') ?? [],
    rule: conclusions?.filter(c => c.type === 'rule') ?? [],
    red_flag: conclusions?.filter(c => c.type === 'red_flag') ?? [],
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wnioski ogólne</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nowy wniosek
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            {editingId ? 'Edytuj wniosek' : 'Nowy wniosek'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
              <div className="flex gap-2">
                {META_CONCLUSION_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, type: t }))}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium border transition-all',
                      form.type === t
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {META_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="np. Efekt kotwiczenia przy negocjacjach"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Opisz wniosek..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!form.title || !form.description || createMut.isPending || updateMut.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {editingId ? 'Zapisz zmiany' : 'Dodaj'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm font-medium border hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-8">
        {(Object.entries(grouped) as [MetaConclusionType, MetaConclusion[]][]).map(([type, items]) => (
          items.length > 0 && (
            <div key={type}>
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                {META_TYPE_LABELS[type]}
                <span className="ml-2 bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </h2>
              <div className="space-y-3">
                {items.map(c => (
                  <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{c.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{c.description}</p>
                      </div>
                      <div className="flex gap-1 ml-4 shrink-0">
                        <button
                          onClick={() => startEdit(c)}
                          className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1"
                        >
                          Edytuj
                        </button>
                        <button
                          onClick={() => deleteMut.mutate(c.id)}
                          className="text-xs text-gray-400 hover:text-red-600 px-2 py-1"
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {conclusions?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Brak wniosków</p>
            <p className="text-sm mt-1">Dodaj biasy, zasady i red flagi, które zaobserwowaliście</p>
          </div>
        )}
      </div>
    </div>
  );
}
