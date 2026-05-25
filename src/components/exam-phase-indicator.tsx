'use client';

import { Check, Clock, Mic, MessageSquare, Trophy } from 'lucide-react';
import { cn, formatTime, getPhaseLabel } from '@/lib/utils';
import type { ExamPhase } from '@/lib/types';

interface Step {
  id: ExamPhase | ExamPhase[];
  label: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { id: ['prep', 'ready_to_record'], label: '备考', icon: <Clock className="h-3.5 w-3.5" /> },
  { id: ['recording', 'processing'], label: '口头报告', icon: <Mic className="h-3.5 w-3.5" /> },
  { id: 'discussion', label: '互动讨论', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { id: 'completed', label: '完成', icon: <Trophy className="h-3.5 w-3.5" /> },
];

interface Props {
  phase: ExamPhase;
  prepSecondsLeft?: number;
  displayId?: string;
}

export function ExamPhaseIndicator({ phase, prepSecondsLeft, displayId }: Props) {
  const matchesPhase = (step: Step) => {
    if (Array.isArray(step.id)) return step.id.includes(phase);
    return step.id === phase;
  };

  const isCompleted = (idx: number) => {
    const phaseOrder: ExamPhase[] = ['prep', 'ready_to_record', 'recording', 'processing', 'discussion', 'completed'];
    const currentIdx = phaseOrder.indexOf(phase);
    const stepPhase = Array.isArray(STEPS[idx].id) ? (STEPS[idx].id as ExamPhase[])[0] : STEPS[idx].id as ExamPhase;
    return phaseOrder.indexOf(stepPhase) < currentIdx;
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
      {/* Phase stepper */}
      <div className="flex items-center gap-1.5 flex-1">
        {STEPS.map((step, idx) => {
          const active = matchesPhase(step);
          const done = isCompleted(idx);
          return (
            <div key={idx} className="flex items-center gap-1.5">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold transition-all',
                  active && 'border-indigo-500 bg-indigo-500 text-white shadow-md shadow-indigo-200',
                  done && 'border-emerald-500 bg-emerald-500 text-white',
                  !active && !done && 'border-slate-300 bg-slate-100 text-slate-400'
                )}
              >
                {done ? <Check className="h-3 w-3" /> : step.icon}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:inline',
                  active && 'text-indigo-700',
                  done && 'text-emerald-600',
                  !active && !done && 'text-slate-400'
                )}
              >
                {step.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className={cn('mx-1 h-px w-4 rounded', done ? 'bg-emerald-400' : 'bg-slate-200')} />
              )}
            </div>
          );
        })}
      </div>

      {/* Prep timer (only during prep phase) */}
      {phase === 'prep' && prepSecondsLeft !== undefined && (
        <div className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-mono font-bold tabular-nums transition-colors',
          prepSecondsLeft <= 60
            ? 'border-red-300 bg-red-50 text-red-700 animate-pulse-slow'
            : 'border-amber-300 bg-amber-50 text-amber-700'
        )}>
          <Clock className="h-3.5 w-3.5" />
          {formatTime(prepSecondsLeft)}
        </div>
      )}

      {/* Display ID */}
      {displayId && (
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 border-l pl-3 ml-1">
          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{displayId}</span>
        </div>
      )}
    </div>
  );
}
