'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, AlertTriangle, ArrowRight, BookOpen, Zap,
  CheckCircle2, RefreshCw, Edit3, ChevronRight,
} from 'lucide-react';

import { VideoPlayer } from '@/components/video-player';
import { CognitiveScratchpad } from '@/components/cognitive-scratchpad';
import { AudioRecorder } from '@/components/audio-recorder';
import { DiscussionChat } from '@/components/discussion-chat';
import { EvaluationReport } from '@/components/evaluation-report';
import { ExamPhaseIndicator } from '@/components/exam-phase-indicator';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { useExamState } from '@/hooks/use-exam-state';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { OralAssignment, PrepNotes, AIEvaluation, DiscussionMessage } from '@/lib/types';

// ─── Mock assignment (replace with Supabase fetch in production) ──────────
const MOCK_ASSIGNMENT: OralAssignment = {
  id: 'mock-001',
  title: '社交媒体对青少年的影响',
  video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
  stimulus_description:
    '录像展示了一群中学生在课间休息时，各自低头专注于手机屏幕，彼此之间鲜少有言语交流。其中一名同学尝试与旁边的同学搭话，对方却未察觉，仍专注于屏幕。背景音乐轻快，与画面中人与人之间的疏离感形成对比。',
  prompt_text:
    '社交媒体的普及令青少年更容易与他人保持联系，但也有人认为这反而拉开了人与人之间的距离。请结合录像内容，分析社交媒体对青少年人际关系的利与弊，并提出你认为最有效的应对建议。',
  teacher_id: null,
  class_targets: ['2A', '2B'],
  due_date: null,
  is_active: true,
  created_at: new Date().toISOString(),
};

// ─── High-quality demo transcript ────────────────────────────
const DEMO_TRANSCRIPT = `在录像中，我观察到一群中学生在课间休息时，各自低头专注于手机屏幕，彼此之间鲜少有言语交流。这一现象在当今社会极为普遍，我们称之为"低头族"现象。

造成这一现象的原因是多方面的。首先，社交媒体平台设计精妙，能够持续激发用户的多巴胺分泌，使人产生依赖性。其次，在同龄人群体中，使用社交媒体已成为一种社交货币，不参与则意味着被边缘化。此外，家长和教师在数字素养教育方面的引导不足，也是不可忽视的原因。

这种现象对青少年的影响是深远的。从负面角度来看，过度依赖社交媒体会导致面对面的沟通能力退化，青少年在现实中的情感联结日趋浅薄。然而，我们也应客观认识到社交媒体的正面价值——它确实拓宽了青少年获取资讯的渠道，并促进了跨地域的交流与合作。

因此，我认为解决之道在于多管齐下。个人层面，青少年应主动培养数字自律，为自己设定合理的使用时限。学校层面，应将数字素养教育纳入正式课程。家庭层面，家长应以身作则，创造无手机的家庭互动时间。只有个人、学校与家庭三方合力，才能帮助青少年在享受科技红利的同时，维护真实而深厚的人际关系。`;

// ─────────────────────────────────────────────────────────────
export default function ExamWorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, actions } = useExamState();

  const [assignment, setAssignment] = useState<OralAssignment | null>(null);
  const [sessionId, setSessionId] = useState('mock-session-' + Date.now());
  const [displayId] = useState('SEC2_HCL_01');
  const [pageError, setPageError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Manual transcript editor state (shown in processing phase when ASR is poor)
  const [showTranscriptEditor, setShowTranscriptEditor] = useState(false);
  const [manualTranscript, setManualTranscript] = useState('');

  // Retry counter
  const [retryCount, setRetryCount] = useState(0);

  // ── Bootstrap ─────────────────────────────────────────────
  useEffect(() => {
    setAssignment(MOCK_ASSIGNMENT);
    setIsBootstrapping(false);
  }, [params.id]);

  // ── Save notes (debounced) ────────────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleNotesChange = useCallback((updated: Partial<PrepNotes>) => {
    actions.updateNotes(updated);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // Persist to Supabase if configured
    }, 1500);
  }, [actions]);

  // ── Core: recording done → upload → Claude questions ─────
  const runQuestionsFlow = useCallback(async (transcript: string) => {
    if (!assignment) return;
    actions.setLoading(true, '正在生成考官问题...');

    const res = await fetch('/api/exam/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        assignment_prompt: assignment.prompt_text,
        session_id: sessionId,
      }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: '网络错误' }));
      throw new Error(error ?? '生成问题失败');
    }

    const { questions } = await res.json() as { questions: string[] };
    actions.initDiscussion(questions);
  }, [actions, assignment, sessionId]);

  const handleRecordingComplete = useCallback(async (blob: Blob, url: string, transcript: string) => {
    actions.finishRecording(blob, url);

    // If transcript too short, show editor first
    const cleanTranscript = transcript.trim();
    if (cleanTranscript.length < 80) {
      setManualTranscript(cleanTranscript);
      setShowTranscriptEditor(true);
      actions.setLoading(false);
      return;
    }

    try {
      actions.setTranscript(cleanTranscript);
      await runQuestionsFlow(cleanTranscript);
    } catch (err) {
      actions.setError('生成问题失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  }, [actions, runQuestionsFlow]);

  // ── Submit manual transcript ──────────────────────────────
  const handleManualTranscriptSubmit = useCallback(async () => {
    const t = manualTranscript.trim();
    if (!t) return;
    setShowTranscriptEditor(false);
    actions.setLoading(true, '正在分析报告内容...');
    actions.setTranscript(t);
    try {
      await runQuestionsFlow(t);
    } catch (err) {
      actions.setError('生成问题失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  }, [actions, manualTranscript, runQuestionsFlow]);

  // ── Demo mode: skip recording, use sample transcript ─────
  const handleDemoMode = useCallback(async () => {
    actions.advanceToReady();
    setTimeout(() => {
      actions.startRecording();
      setTimeout(async () => {
        actions.finishRecording(new Blob(), '');
        actions.setTranscript(DEMO_TRANSCRIPT);
        try {
          await runQuestionsFlow(DEMO_TRANSCRIPT);
        } catch (err) {
          actions.setError('Demo error: ' + (err instanceof Error ? err.message : ''));
        }
      }, 300);
    }, 200);
  }, [actions, runQuestionsFlow]);

  // ── Student submits a discussion answer ──────────────────
  const handleStudentAnswer = useCallback(async (answer: string) => {
    actions.submitStudentAnswer(answer);
    await new Promise(r => setTimeout(r, 600));

    const nextIndex = state.questionIndex + 1;
    const allDone = nextIndex >= state.allQuestions.length;

    if (allDone) {
      // Build final log including this answer (state.discussionMessages is still pre-answer here)
      const updatedLog: DiscussionMessage[] = [
        ...state.discussionMessages,
        { role: 'student', content: answer, timestamp: new Date().toISOString() },
      ];
      actions.setLoading(true, '正在生成综合评估报告... (约需30秒)');
      try {
        const res = await fetch('/api/exam/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: state.transcript ?? '',
            discussion_log: updatedLog,
            session_id: sessionId,
          }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: '网络错误' }));
          throw new Error(error);
        }
        const { evaluation } = await res.json() as { evaluation: AIEvaluation };
        actions.setEvaluation(evaluation);
        actions.completeExam();
      } catch (err) {
        actions.setError('生成评估失败：' + (err instanceof Error ? err.message : '未知错误'));
      }
    } else {
      actions.advanceQuestion();
    }
  }, [actions, sessionId, state]);

  // ── Retry after error ─────────────────────────────────────
  const handleRetry = useCallback(() => {
    actions.setError('');
    setRetryCount(c => c + 1);
  }, [actions]);

  // ─────────────────────────────────────────────────────────
  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }
  if (!assignment) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>找不到该口试题目。</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { phase, prepNotes, prepSecondsLeft, discussionMessages, questionIndex,
    allQuestions, isLoading, loadingMessage, error, evaluation, audioUrl } = state;

  const videoDisabled = phase !== 'prep' && phase !== 'ready_to_record';

  // ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">

      {/* ── Top bar ── */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 z-10 shadow-sm">
        <div className="mx-auto max-w-[1400px] flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span className="font-bold text-slate-800 text-sm hidden sm:inline">高级华文口试大师</span>
          </div>
          <div className="flex-1 min-w-0">
            <ExamPhaseIndicator
              phase={phase}
              prepSecondsLeft={phase === 'prep' ? prepSecondsLeft : undefined}
              displayId={displayId}
            />
          </div>
        </div>
      </div>

      {/* ── Error banner with retry ── */}
      {error && (
        <div className="shrink-0 flex items-center justify-between gap-3 bg-red-600 px-5 py-2">
          <div className="flex items-center gap-2 text-sm text-white">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 gap-1.5 bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={handleRetry}>
            <RefreshCw className="h-3.5 w-3.5" /> 重试
          </Button>
        </div>
      )}

      {/* ── Split screen ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ════ LEFT — Video & Prompt ════ */}
        <div className="flex w-[42%] min-w-[320px] flex-col overflow-hidden border-r border-slate-200 bg-white">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <VideoPlayer
                videoUrl={assignment.video_url}
                stimulusDescription={assignment.stimulus_description}
                promptText={assignment.prompt_text}
                disabled={videoDisabled}
              />
            </div>
          </ScrollArea>
        </div>

        {/* ════ RIGHT — Phase Wizard ════ */}
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">

          {/* ── PREP PHASE ── */}
          {(phase === 'prep' || phase === 'ready_to_record') && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="shrink-0 bg-white border-b border-slate-200 px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">
                      {phase === 'prep' ? '第一步：分析录像，整理思路' : '✅ 备考完成 — 准备开始录音'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {phase === 'prep'
                        ? '在四个框架栏填写分析笔记。备考结束后笔记将在录音时保持可见。'
                        : '您的笔记已锁定。确认环境安静后，点击下方按钮开始录音。'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {phase === 'prep' && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={actions.advanceToReady}>
                          提前完成备考 <ArrowRight className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700 border border-amber-200"
                          onClick={handleDemoMode}
                          title="使用AI示范报告体验完整考官问答流程"
                        >
                          <Zap className="h-3 w-3" /> 示范模式
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 px-5 py-4">
                <CognitiveScratchpad
                  notes={prepNotes}
                  onChange={handleNotesChange}
                  readOnly={phase === 'ready_to_record'}
                />
              </ScrollArea>

              {phase === 'ready_to_record' && (
                <div className="shrink-0 border-t border-slate-200 bg-white p-4 space-y-2">
                  <Button
                    size="lg"
                    className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 text-base font-semibold"
                    onClick={actions.startRecording}
                  >
                    🎙️ 开始2分钟口头报告
                  </Button>
                  <p className="text-center text-xs text-slate-400">
                    录音开始后不可暂停 · 请确保在安静环境中进行
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── RECORDING PHASE ── */}
          {phase === 'recording' && (
            <div className="flex flex-col h-full">
              <div className="shrink-0 bg-red-50 border-b border-red-200 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="text-sm font-bold text-red-700">录音中 · 口头报告</h2>
                  <Badge variant="destructive" className="text-xs ml-auto">请勿关闭页面</Badge>
                </div>
                <p className="text-xs text-red-500 mt-1">按框架顺序阐述您的分析。时间到后录音自动停止。</p>
              </div>
              <ScrollArea className="flex-1 px-5 py-4">
                <AudioRecorder
                  isActive
                  onRecordingComplete={handleRecordingComplete}
                  readonlyNotes={
                    <CognitiveScratchpad notes={prepNotes} onChange={() => {}} readOnly compact />
                  }
                />
              </ScrollArea>
            </div>
          )}

          {/* ── PROCESSING PHASE ── */}
          {phase === 'processing' && !showTranscriptEditor && (
            <div className="flex flex-col h-full items-center justify-center gap-5 px-8 text-center">
              <div className="relative">
                <Loader2 className="h-14 w-14 animate-spin text-indigo-400" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-indigo-100" />
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-700">{loadingMessage || '处理中...'}</p>
                <p className="text-sm text-slate-400 mt-1">AI考官正在分析您的报告，请稍候</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs mt-2"
                onClick={() => setShowTranscriptEditor(true)}
              >
                <Edit3 className="h-3.5 w-3.5" />
                手动输入报告内容
              </Button>
            </div>
          )}

          {/* ── MANUAL TRANSCRIPT EDITOR ── */}
          {phase === 'processing' && showTranscriptEditor && (
            <div className="flex flex-col h-full">
              <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-5 py-3">
                <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  手动输入口头报告内容
                </h2>
                <p className="text-xs text-amber-600 mt-0.5">
                  若语音识别未能准确转录，请在此输入您的报告要点（可使用关键词）
                </p>
              </div>
              <div className="flex-1 flex flex-col px-5 py-4 gap-3">
                <Textarea
                  className="flex-1 font-chinese text-sm resize-none"
                  placeholder="请输入您口头报告的主要内容，包括：现象描述、原因分析、影响评估、建议措施..."
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{manualTranscript.replace(/\s/g,'').length} 字（建议 100 字以上）</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setManualTranscript(DEMO_TRANSCRIPT); }}>
                      填入示范内容
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={handleManualTranscriptSubmit}
                      disabled={manualTranscript.replace(/\s/g,'').length < 30}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      开始讨论
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── DISCUSSION PHASE ── */}
          {phase === 'discussion' && (
            <div className="flex flex-col h-full">
              <div className="shrink-0 bg-indigo-50 border-b border-indigo-200 px-5 py-3">
                <h2 className="text-sm font-bold text-indigo-800">第三步：互动讨论 · AI考官问答</h2>
                <p className="text-xs text-indigo-500 mt-0.5">考官根据您的报告内容提问，请认真作答每一道问题。</p>
              </div>
              <div className="flex-1 min-h-0 px-5 py-4 flex flex-col overflow-hidden">
                <DiscussionChat
                  messages={discussionMessages}
                  questionIndex={questionIndex}
                  totalQuestions={allQuestions.length}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSubmitAnswer={handleStudentAnswer}
                />
              </div>
            </div>
          )}

          {/* ── COMPLETED PHASE ── */}
          {phase === 'completed' && evaluation && (
            <div className="flex flex-col h-full">
              <div className="shrink-0 bg-emerald-50 border-b border-emerald-200 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-emerald-800">口试完成 · 综合评估报告</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={handleDemoMode}>
                      <RefreshCw className="h-3 w-3" />再练一次
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => router.push('/student/dashboard')}>
                      返回控制台
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0 px-5 py-4 overflow-hidden">
                <EvaluationReport evaluation={evaluation} audioUrl={audioUrl} displayId={displayId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
