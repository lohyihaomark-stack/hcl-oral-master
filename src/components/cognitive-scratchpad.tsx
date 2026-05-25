'use client';

import { useCallback } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { PrepNotes } from '@/lib/types';

interface SectionConfig {
  key: keyof PrepNotes;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  bg: string;
  placeholder: string;
  prompts: string[];
}

const SECTIONS: SectionConfig[] = [
  {
    key: 'phenomenon',
    label: '现象',
    labelEn: 'Phenomenon',
    icon: <Brain className="h-4 w-4" />,
    color: 'text-violet-700',
    border: 'border-violet-200',
    bg: 'bg-violet-50',
    placeholder: '描述录像中观察到的主要社会现象...',
    prompts: ['录像展示了什么场景？', '涉及哪些群体？', '现象的规模与普遍性如何？'],
  },
  {
    key: 'causes',
    label: '原因',
    labelEn: 'Root Causes',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-blue-700',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    placeholder: '分析导致此现象的深层原因（个人、社会、科技等层面）...',
    prompts: ['个人因素？', '社会/文化因素？', '科技/经济因素？'],
  },
  {
    key: 'impacts',
    label: '影响',
    labelEn: 'Impacts',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    placeholder: '分析此现象对个人、家庭及社会的正负面影响...',
    prompts: ['对个人的影响？', '对家庭/人际关系的影响？', '对社会整体的影响？'],
  },
  {
    key: 'solutions',
    label: '建议与总结',
    labelEn: 'Solutions & Conclusion',
    icon: <Lightbulb className="h-4 w-4" />,
    color: 'text-emerald-700',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    placeholder: '提出切实可行的建议，并总结你的核心观点...',
    prompts: ['个人层面的建议？', '政府/学校的措施？', '一句话总结你的立场？'],
  },
];

interface Props {
  notes: PrepNotes;
  onChange: (updated: Partial<PrepNotes>) => void;
  readOnly?: boolean;
  compact?: boolean;  // Condensed view during recording phase
}

export function CognitiveScratchpad({ notes, onChange, readOnly = false, compact = false }: Props) {
  const handleChange = useCallback(
    (key: keyof PrepNotes, value: string) => {
      onChange({ [key]: value });
    },
    [onChange]
  );

  const wordCount = useCallback((text: string) => {
    return text.replace(/\s/g, '').length;
  }, []);

  if (compact) {
    // Read-only compact view shown alongside the recorder
    return (
      <div className="space-y-2">
        {SECTIONS.map((s) => (
          <div key={s.key} className={cn('rounded-md border p-2', s.border, s.bg)}>
            <div className={cn('flex items-center gap-1.5 text-xs font-semibold mb-1', s.color)}>
              {s.icon}
              {s.label}
              <span className="text-slate-400 font-normal">({s.labelEn})</span>
            </div>
            <p className="text-xs text-slate-600 font-chinese leading-relaxed line-clamp-3 whitespace-pre-wrap">
              {notes[s.key] || <span className="italic text-slate-400">（未填写）</span>}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Framework header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">HCL 分析框架</h3>
          <p className="text-xs text-slate-500">结构化笔记将在录音时全程可见</p>
        </div>
        <Badge variant="info" className="text-xs">备考中</Badge>
      </div>

      <Separator className="mb-4" />

      {/* Four framework sections */}
      {SECTIONS.map((section, idx) => (
        <div key={section.key}>
          <div className={cn('rounded-lg border-2 overflow-hidden', section.border)}>
            {/* Section header */}
            <div className={cn('flex items-center justify-between px-3 py-2', section.bg)}>
              <div className={cn('flex items-center gap-2 font-semibold text-sm', section.color)}>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/60 text-xs font-bold">
                  {idx + 1}
                </span>
                {section.icon}
                <span>{section.label}</span>
                <span className="text-xs font-normal text-slate-500">/ {section.labelEn}</span>
              </div>
              <span className={cn('text-xs tabular-nums', section.color)}>
                {wordCount(notes[section.key])} 字
              </span>
            </div>

            {/* Prompt chips */}
            <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1">
              {section.prompts.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500 cursor-pointer hover:bg-slate-50 select-none"
                  onClick={() => {
                    if (!readOnly) {
                      const current = notes[section.key];
                      const separator = current.trim() ? '\n' : '';
                      handleChange(section.key, current + separator + p.replace('？', '：'));
                    }
                  }}
                >
                  ＋ {p}
                </span>
              ))}
            </div>

            {/* Text area */}
            <Textarea
              className={cn(
                'border-0 rounded-none focus-visible:ring-0 resize-none bg-white text-sm',
                readOnly && 'cursor-default bg-slate-50 text-slate-500'
              )}
              rows={3}
              placeholder={section.placeholder}
              value={notes[section.key]}
              onChange={(e) => handleChange(section.key, e.target.value)}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>
        </div>
      ))}

      {/* Total summary bar */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 mt-2">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>框架完整度</span>
          <span>
            {SECTIONS.filter((s) => notes[s.key].trim().length > 0).length} / {SECTIONS.length} 项已填写
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500"
            style={{
              width: `${(SECTIONS.filter((s) => notes[s.key].trim().length > 0).length / SECTIONS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
