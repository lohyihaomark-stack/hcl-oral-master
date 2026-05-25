'use client';

import { useEffect, useState } from 'react';
import { Trophy, AlertCircle, Lightbulb, BarChart3, MessageSquare, Tag, Repeat2, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { AIEvaluation } from '@/lib/types';

// ─── Animated SVG ring dial ───────────────────────────────────
function ScoreDial({
  value, max, label, color, delay = 0,
}: { value: number; max: number; label: string; color: string; delay?: number }) {
  const [animated, setAnimated] = useState(false);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const pct = animated ? value / max : 0;
  const offset = circumference * (1 - pct);

  const grade = value >= max * 0.85 ? 'A' : value >= max * 0.7 ? 'B' : value >= max * 0.55 ? 'C' : 'D';
  const gradeColor =
    grade === 'A' ? 'text-emerald-600' :
    grade === 'B' ? 'text-blue-600' :
    grade === 'C' ? 'text-amber-600' : 'text-red-500';

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-[88px] w-[88px]">
        <svg className="h-[88px] w-[88px] -rotate-90" viewBox="0 0 80 80">
          {/* Track */}
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="7" />
          {/* Progress */}
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: `stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms` }}
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-black text-slate-800 tabular-nums leading-none">{value}</p>
          <p className="text-[10px] text-slate-400 leading-none mt-0.5">/{max}</p>
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-600 text-center leading-tight">{label}</p>
      <Badge variant="outline" className={cn('text-xs font-bold px-2', gradeColor)}>{grade}</Badge>
    </div>
  );
}

// ─── Grade badge ──────────────────────────────────────────────
function totalGradeInfo(total: number) {
  if (total >= 36) return { grade: 'A1', cls: 'bg-emerald-500 text-white border-emerald-600' };
  if (total >= 32) return { grade: 'A2', cls: 'bg-emerald-400 text-white border-emerald-500' };
  if (total >= 28) return { grade: 'B3', cls: 'bg-blue-500 text-white border-blue-600' };
  if (total >= 24) return { grade: 'B4', cls: 'bg-blue-400 text-white border-blue-500' };
  if (total >= 20) return { grade: 'C5', cls: 'bg-amber-500 text-white border-amber-600' };
  if (total >= 16) return { grade: 'C6', cls: 'bg-amber-400 text-white border-amber-500' };
  return { grade: 'F9', cls: 'bg-red-500 text-white border-red-600' };
}

interface Props {
  evaluation: AIEvaluation;
  audioUrl: string | null;
  displayId: string;
}

export function EvaluationReport({ evaluation, audioUrl, displayId }: Props) {
  const { scores, fluency_metrics, syntax_errors, vocabulary_upgrader, class_macro_tags, examiner_feedback } = evaluation;
  const { grade, cls } = totalGradeInfo(scores.total);
  const fillerSeverity = fluency_metrics.filler_word_count > 15 ? 'destructive' :
    fluency_metrics.filler_word_count > 8 ? 'warning' : 'success';

  return (
    <ScrollArea className="h-full pr-1">
      <div className="space-y-4 pb-6">

        {/* ── Hero header ── */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-5 w-5 text-indigo-500" />
                <h2 className="text-base font-bold text-slate-800">SEAB HCL 口试评估报告</h2>
              </div>
              <p className="text-xs text-slate-400 font-mono mb-3">考生编号：{displayId}</p>

              {/* Macro tags */}
              <div className="flex flex-wrap gap-1.5">
                {class_macro_tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs font-chinese">{t}</Badge>
                ))}
              </div>
            </div>

            {/* Total score */}
            <div className={cn('shrink-0 rounded-2xl border-2 px-5 py-3 text-center shadow-sm', cls)}>
              <p className="text-4xl font-black tabular-nums leading-none">{scores.total}</p>
              <p className="text-xs font-semibold opacity-80 mt-0.5">/40 分</p>
              <p className="text-lg font-black mt-1 opacity-90">{grade}</p>
            </div>
          </div>
        </div>

        {/* ── Score rings ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              评分细则
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around items-start py-2">
              <ScoreDial value={scores.content_depth}     max={20} label="内容深度" color="#8b5cf6" delay={0}   />
              <ScoreDial value={scores.structure_logic}   max={20} label="逻辑结构" color="#3b82f6" delay={150} />
              <ScoreDial value={scores.vocabulary_language} max={20} label="语言词汇" color="#10b981" delay={300} />
            </div>

            <Separator className="my-4" />

            {/* Fluency */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">流利度指标</p>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'rounded-lg px-3 py-1.5 text-center',
                  fillerSeverity === 'destructive' ? 'bg-red-100 text-red-700' :
                  fillerSeverity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                )}>
                  <p className="text-2xl font-black tabular-nums">{fluency_metrics.filler_word_count}</p>
                  <p className="text-[10px] font-medium">填充词</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {fluency_metrics.frequent_fillers.map((f) => (
                    <Badge key={f} variant="warning" className="text-xs font-chinese">{f}</Badge>
                  ))}
                  {fluency_metrics.frequent_fillers.length === 0 && (
                    <Badge variant="success" className="text-xs">✓ 无明显填充词</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Examiner feedback ── */}
        <Card className="border-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              考官综合反馈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 font-chinese leading-[1.9] whitespace-pre-wrap">
              {examiner_feedback}
            </p>
          </CardContent>
        </Card>

        {/* ── Syntax errors ── */}
        {syntax_errors.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-red-500" />
                语法与用词纠错
                <Badge variant="destructive" className="text-xs ml-auto">{syntax_errors.length} 处</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {syntax_errors.map((err, i) => (
                <div key={i} className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                    <span className="inline-flex items-center gap-1 text-sm text-red-600 font-chinese line-through decoration-red-400">
                      ❌ {err.error_text}
                    </span>
                    <span className="text-slate-400 text-xs shrink-0">→</span>
                    <span className="inline-flex items-center gap-1 text-sm text-emerald-700 font-chinese font-semibold">
                      ✅ {err.correction}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 bg-white/70 rounded-lg px-2.5 py-1.5 border border-red-100">
                    {err.explanation}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Vocabulary upgrader ── */}
        {vocabulary_upgrader.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                词汇升级建议
                <Badge variant="warning" className="text-xs ml-auto">{vocabulary_upgrader.length} 组</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {vocabulary_upgrader.map((v, i) => (
                <div key={i} className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-sm text-slate-500 font-chinese">{v.original}</span>
                    <Repeat2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-sm font-bold text-amber-800 font-chinese">{v.upgraded}</span>
                    {v.idiom_flag && (
                      <Badge variant="warning" className="text-[10px] px-1.5">成语</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-chinese">{v.context}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Audio playback ── */}
        {audioUrl && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Volume2 className="h-4 w-4 text-slate-500" />
                回听口头报告录音
              </CardTitle>
            </CardHeader>
            <CardContent>
              <audio src={audioUrl} controls className="w-full rounded-lg" />
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
