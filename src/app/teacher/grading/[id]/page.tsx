'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EvaluationReport } from '@/components/evaluation-report';
import type { AIEvaluation } from '@/lib/types';

// Mock evaluation for teacher view
const MOCK_EVALUATION: AIEvaluation = {
  scores: {
    content_depth: 15,
    structure_logic: 14,
    vocabulary_language: 13,
    total: 28,
  },
  fluency_metrics: {
    filler_word_count: 9,
    frequent_fillers: ['然后', '那个', '呃'],
  },
  syntax_errors: [
    {
      error_text: '在录像中，我看到两个学校学生',
      correction: '在录像中，我看到两名身穿校服的学生',
      explanation: '量词错用（个→名），修饰成分需调整语序',
    },
    {
      error_text: '社交媒体有很多好处，也有很多坏处',
      correction: '社交媒体的优势与弊端并存，不可一概而论',
      explanation: '用词平淡，"好处/坏处"宜替换为书面词汇',
    },
  ],
  vocabulary_upgrader: [
    {
      original: '很多人看手机',
      upgraded: '"低头族"比比皆是',
      idiom_flag: true,
      context: '描写公共场所的社会现象，"低头族"为时事词汇，更具说服力',
    },
    {
      original: '觉得很不高兴',
      upgraded: '深感愤懑与不满',
      idiom_flag: false,
      context: '表达民众对不文明行为的情绪反应，书面语更正式',
    },
    {
      original: '影响很大',
      upgraded: '影响深远，不容小觑',
      idiom_flag: false,
      context: '增强语气，使论点更有力',
    },
  ],
  class_macro_tags: ['框架完整', '词汇单调', '思辨力尚可', '结语薄弱'],
  examiner_feedback:
    '该生对社交媒体议题的分析框架较为完整，能按现象、原因、影响的顺序展开论述，思维条理清晰。然而，词汇运用较为基础，多处可用更精准的书面用语或成语替换。填充词（"然后"、"那个"）使用频率偏高，影响语言流畅度。互动讨论环节对考官追问的回应尚属合理，但论点缺乏纵深，建议多思考反驳观点以强化论证。建议加强词汇积累，尤其是时事词汇与四字成语。',
};

export default function TeacherGradingPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          <Link href="/teacher/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> 返回
            </Button>
          </Link>
          <GraduationCap className="h-5 w-5 text-violet-600" />
          <span className="font-bold text-slate-800">批阅面板 — {params.id}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <EvaluationReport
          evaluation={MOCK_EVALUATION}
          audioUrl={null}
          displayId="SEC2_HCL_03"
        />
      </main>
    </div>
  );
}
