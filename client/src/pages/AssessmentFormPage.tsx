import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getDecision,
  getMyAssessment,
  updateMyAssessment,
  lockMyAssessment,
  getMyResponsibility,
  updateMyResponsibility,
  getAssessmentStatus,
} from '../api/endpoints';
import { cn } from '../lib/cn';
import { BURDEN_LABELS, RATING_LABELS } from '../lib/labels';
import type { UpdateAssessmentInput, UpdateResponsibilityInput, BurdenOption, AssessmentItemType } from 'shared';
import { BURDEN_OPTIONS, RATINGS } from 'shared';

export function AssessmentFormPage() {
  const { id } = useParams<{ id: string }>();
  const decisionId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: decision } = useQuery({
    queryKey: ['decision', id],
    queryFn: () => getDecision(decisionId),
  });
  const { data: assessment, isLoading: loadingAssessment } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => getMyAssessment(decisionId),
  });
  const { data: responsibility, isLoading: loadingResp } = useQuery({
    queryKey: ['responsibility', id],
    queryFn: () => getMyResponsibility(decisionId),
  });
  const { data: statusData } = useQuery({
    queryKey: ['assessment-status', decisionId],
    queryFn: () => getAssessmentStatus(decisionId),
    refetchInterval: 5000,
  });

  // Assessment form state
  const [rating, setRating] = useState<number | null>(null);
  const [wouldDoAgain, setWouldDoAgain] = useState<boolean | null>(null);
  const [biggestRisk, setBiggestRisk] = useState('');
  const [pros, setPros] = useState<string[]>(['']);
  const [cons, setCons] = useState<string[]>(['']);

  // Responsibility form state
  const [broughtTopic, setBroughtTopic] = useState<BurdenOption | null>(null);
  const [pushedExecution, setPushedExecution] = useState<BurdenOption | null>(null);
  const [mainBurden, setMainBurden] = useState<BurdenOption | null>(null);

  // Save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showLockDialog, setShowLockDialog] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const initializedRef = useRef(false);

  const isLocked = assessment?.status === 'locked';

  // Initialize from server data
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (initializedRef.current || loadingAssessment) return;
    if (assessment) {
      setRating(assessment.rating);
      setWouldDoAgain(assessment.would_do_again === null ? null : Boolean(assessment.would_do_again));
      setBiggestRisk(assessment.biggest_ignored_risk ?? '');
      const existingPros = assessment.items.filter(i => i.type === 'pro').map(i => i.text);
      const existingCons = assessment.items.filter(i => i.type === 'con').map(i => i.text);
      setPros(existingPros.length > 0 ? existingPros : ['']);
      setCons(existingCons.length > 0 ? existingCons : ['']);
    }
    initializedRef.current = true;
  }, [assessment, loadingAssessment]);

  useEffect(() => {
    if (loadingResp) return;
    if (responsibility) {
      setBroughtTopic(responsibility.brought_topic as BurdenOption | null);
      setPushedExecution(responsibility.pushed_execution as BurdenOption | null);
      setMainBurden(responsibility.main_burden as BurdenOption | null);
    }
  }, [responsibility, loadingResp]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Build input for save
  const buildAssessmentInput = useCallback((): UpdateAssessmentInput => {
    const items: { type: AssessmentItemType; text: string; sort_order: number }[] = [];
    pros.forEach((text, i) => {
      if (text.trim()) items.push({ type: 'pro', text: text.trim(), sort_order: i });
    });
    cons.forEach((text, i) => {
      if (text.trim()) items.push({ type: 'con', text: text.trim(), sort_order: i });
    });
    return {
      rating,
      would_do_again: wouldDoAgain,
      biggest_ignored_risk: biggestRisk || null,
      items,
    };
  }, [rating, wouldDoAgain, biggestRisk, pros, cons]);

  const buildResponsibilityInput = useCallback((): UpdateResponsibilityInput => ({
    brought_topic: broughtTopic,
    pushed_execution: pushedExecution,
    main_burden: mainBurden,
  }), [broughtTopic, pushedExecution, mainBurden]);

  // Auto-save with debounce
  const saveMutation = useMutation({
    mutationFn: async () => {
      setSaveStatus('saving');
      await updateMyAssessment(decisionId, buildAssessmentInput());
      await updateMyResponsibility(decisionId, buildResponsibilityInput());
    },
    onSuccess: () => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => setSaveStatus('idle'),
  });

  const scheduleSave = useCallback(() => {
    if (isLocked) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveMutation.mutate();
    }, 2000);
  }, [isLocked, saveMutation]);

  // Trigger auto-save on form changes
  useEffect(() => {
    if (!initializedRef.current || isLocked || loadingAssessment) return;
    scheduleSave();
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [rating, wouldDoAgain, biggestRisk, pros, cons, broughtTopic, pushedExecution, mainBurden, isLocked, loadingAssessment, scheduleSave]);

  // Lock mutation
  const lockMutation = useMutation({
    mutationFn: async () => {
      // Save first
      await updateMyAssessment(decisionId, buildAssessmentInput());
      await updateMyResponsibility(decisionId, buildResponsibilityInput());
      await lockMyAssessment(decisionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', id] });
      queryClient.invalidateQueries({ queryKey: ['assessment-status'] });
      setShowLockDialog(false);
      navigate(`/decisions/${decisionId}/wait`);
    },
  });

  if (loadingAssessment || loadingResp) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isLocked) {
    // Check if both locked -> redirect to compare
    if (statusData?.a_locked && statusData?.b_locked) {
      navigate(`/decisions/${decisionId}/compare`);
      return null;
    }
    navigate(`/decisions/${decisionId}/wait`);
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/decisions" className="text-sm text-blue-600 hover:text-blue-800">&larr; Powrót</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{decision?.name}</h1>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <div className="space-y-8">
        {/* Rating */}
        <FormSection title="Ocena ogólna">
          <div className="flex gap-2">
            {RATINGS.map((r) => (
              <button
                key={r}
                onClick={() => setRating(r)}
                className={cn(
                  'flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all',
                  rating === r
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <div className="text-lg">{r}</div>
                <div className="text-xs mt-0.5">{RATING_LABELS[r]}</div>
              </button>
            ))}
          </div>
        </FormSection>

        {/* Pros */}
        <FormSection title="Argumenty za">
          <ListEditor
            items={pros}
            onChange={setPros}
            placeholder="Co przemawiało za tą decyzją..."
          />
        </FormSection>

        {/* Cons */}
        <FormSection title="Argumenty przeciw">
          <ListEditor
            items={cons}
            onChange={setCons}
            placeholder="Co przemawiało przeciw tej decyzji..."
          />
        </FormSection>

        {/* Would do again */}
        <FormSection title="Czy podjąłbyś tę decyzję ponownie?">
          <div className="flex gap-3">
            {[
              { value: true, label: 'Tak' },
              { value: false, label: 'Nie' },
            ].map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => setWouldDoAgain(opt.value)}
                className={cn(
                  'flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                  wouldDoAgain === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FormSection>

        {/* Biggest ignored risk */}
        <FormSection title="Największe zignorowane ryzyko">
          <textarea
            value={biggestRisk}
            onChange={(e) => setBiggestRisk(e.target.value)}
            placeholder="Jakie ryzyko zignorowaliście przy tej decyzji..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormSection>

        {/* Responsibility */}
        <FormSection title="Odpowiedzialność" description="To informacja, nie oskarżenie. Celem jest nauka z doświadczeń.">
          <div className="space-y-4">
            <ResponsibilitySelect
              label="Kto zainicjował temat?"
              value={broughtTopic}
              onChange={setBroughtTopic}
            />
            <ResponsibilitySelect
              label="Kto pchał realizację?"
              value={pushedExecution}
              onChange={setPushedExecution}
            />
            <ResponsibilitySelect
              label="Na kim spoczywał główny ciężar?"
              value={mainBurden}
              onChange={setMainBurden}
            />
          </div>
        </FormSection>

        {/* Lock button */}
        <div className="border-t pt-6">
          <button
            onClick={() => setShowLockDialog(true)}
            className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Zablokuj ocenę i czekaj na drugą osobę
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Po zablokowaniu nie będzie można edytować oceny
          </p>
        </div>
      </div>

      {/* Lock confirmation dialog */}
      {showLockDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Zablokować ocenę?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Po zablokowaniu nie będzie można edytować oceny. Ocena drugiej osoby będzie widoczna
              dopiero po zablokowaniu obu ocen.
            </p>
            {lockMutation.isError && (
              <p className="text-sm text-red-600 mb-3 p-2 bg-red-50 rounded">{(lockMutation.error as Error).message}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => lockMutation.mutate()}
                disabled={lockMutation.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {lockMutation.isPending ? 'Blokuję...' : 'Tak, zablokuj'}
              </button>
              <button
                onClick={() => setShowLockDialog(false)}
                className="flex-1 py-2 bg-white text-gray-600 rounded-lg text-sm font-medium border hover:bg-gray-50"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-1">{title}</h2>
      {description && <p className="text-sm text-gray-500 mb-3">{description}</p>}
      {!description && <div className="mb-3" />}
      {children}
    </div>
  );
}

function ListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, '']);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {items.length > 1 && (
            <button
              onClick={() => removeItem(i)}
              className="px-2 text-gray-400 hover:text-red-500"
            >
              &times;
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Dodaj
      </button>
    </div>
  );
}

function ResponsibilitySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BurdenOption | null;
  onChange: (v: BurdenOption) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        {BURDEN_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium border transition-all',
              value === opt
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            {BURDEN_LABELS[opt]}
          </button>
        ))}
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  if (status === 'idle') return null;
  return (
    <span className={cn(
      'text-sm',
      status === 'saving' ? 'text-yellow-600' : 'text-green-600'
    )}>
      {status === 'saving' ? 'Zapisywanie...' : 'Zapisano'}
    </span>
  );
}
