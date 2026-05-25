'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Mic, MicOff, Send, GraduationCap, User, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import type { DiscussionMessage } from '@/lib/types';

// ─── Typing indicator ─────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-indigo-400"
          style={{
            animation: 'bounce 1.2s infinite ease-in-out',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

interface Props {
  messages: DiscussionMessage[];
  questionIndex: number;
  totalQuestions: number;
  isLoading: boolean;
  loadingMessage: string;
  onSubmitAnswer: (answer: string) => void;
}

export function DiscussionChat({
  messages, questionIndex, totalQuestions, isLoading, loadingMessage, onSubmitAnswer,
}: Props) {
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textAnswer, setTextAnswer] = useState('');
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const { isSupported, isListening, finalTranscript, interimTranscript, startListening, stopListening, reset } =
    useSpeechRecognition({ language: 'zh-TW', continuous: false });

  // Auto-scroll on new message
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleVoiceToggle = useCallback(() => {
    if (!isSupported) { setInputMode('text'); return; }
    if (isListening) { stopListening(); } else { reset(); startListening(); }
  }, [isListening, isSupported, reset, startListening, stopListening]);

  const handleSubmit = useCallback(() => {
    const answer = inputMode === 'voice' ? finalTranscript.trim() : textAnswer.trim();
    if (!answer) return;
    if (isListening) stopListening();
    reset();
    setTextAnswer('');
    onSubmitAnswer(answer);
  }, [finalTranscript, inputMode, isListening, onSubmitAnswer, reset, stopListening, textAnswer]);

  const awaitingAnswer = !isLoading && messages.length > 0 && messages[messages.length - 1].role === 'examiner';
  const currentAnswer = inputMode === 'voice' ? finalTranscript + interimTranscript : textAnswer;

  return (
    <div className="flex flex-col h-full gap-3 min-h-0">
      {/* Progress */}
      <div className="flex items-center gap-2 shrink-0">
        <GraduationCap className="h-4 w-4 text-indigo-600 shrink-0" />
        <span className="text-sm font-bold text-slate-700 flex-1">互动讨论</span>
        <Badge variant="info" className="text-xs tabular-nums shrink-0">
          {Math.min(questionIndex + 1, totalQuestions)} / {totalQuestions} 题
        </Badge>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden shrink-0">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
          style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-2.5', msg.role === 'student' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'examiner' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 ring-1 ring-indigo-200 mt-1">
                <GraduationCap className="h-4 w-4 text-indigo-600" />
              </div>
            )}
            <div className={cn(
              'max-w-[82%] rounded-2xl px-4 py-3 shadow-sm',
              msg.role === 'examiner'
                ? 'rounded-tl-sm bg-white border border-slate-200 text-slate-800'
                : 'rounded-tr-sm bg-indigo-600 text-white'
            )}>
              {msg.role === 'examiner' && (
                <p className="text-[10px] font-bold text-indigo-400 mb-1 uppercase tracking-wider">
                  考官 · 问题 {(msg.questionIndex ?? 0) + 1}
                </p>
              )}
              <p className="text-sm font-chinese leading-[1.8] whitespace-pre-wrap">{msg.content}</p>
              <p className={cn('text-[10px] mt-1.5', msg.role === 'examiner' ? 'text-slate-400' : 'text-indigo-200')}>
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'student' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 mt-1">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Examiner typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-2.5 justify-start">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 ring-1 ring-indigo-200">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold text-indigo-400 mb-2 uppercase tracking-wider">考官</p>
              <TypingDots />
              <p className="text-[10px] text-slate-400 mt-1.5">{loadingMessage}</p>
            </div>
          </div>
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Answer input */}
      {awaitingAnswer && (
        <div className="shrink-0 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-3 space-y-2.5">
          {/* Mode toggle */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-indigo-700">您的回答</p>
            <div className="flex rounded-lg border border-indigo-200 bg-white overflow-hidden text-xs">
              <button
                className={cn('flex items-center gap-1 px-2.5 py-1 transition-colors', inputMode === 'voice' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50')}
                onClick={() => setInputMode('voice')}
              >
                <Mic className="h-3 w-3" /> 语音
              </button>
              <button
                className={cn('flex items-center gap-1 px-2.5 py-1 transition-colors', inputMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50')}
                onClick={() => setInputMode('text')}
              >
                <Keyboard className="h-3 w-3" /> 文字
              </button>
            </div>
          </div>

          {inputMode === 'voice' ? (
            <div className="space-y-2">
              <div className={cn(
                'rounded-lg bg-white border p-2.5 min-h-[56px] transition-colors',
                isListening ? 'border-red-300 bg-red-50/30' : 'border-indigo-100'
              )}>
                <p className="text-sm text-slate-600 font-chinese leading-relaxed">
                  {finalTranscript}
                  <span className="text-slate-400 italic">{interimTranscript}</span>
                  {!finalTranscript && !interimTranscript && (
                    <span className="text-slate-300 text-xs">
                      {isListening ? '正在聆听，请发言...' : '点击"开始回答"后发言'}
                    </span>
                  )}
                </p>
              </div>

              {!isSupported && (
                <Alert variant="warning">
                  <AlertDescription className="text-xs">浏览器不支持语音输入，请切换文字模式。</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  variant={isListening ? 'destructive' : 'default'}
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={handleVoiceToggle}
                  disabled={!isSupported}
                >
                  {isListening
                    ? <><MicOff className="h-3.5 w-3.5" />停止</>
                    : <><Mic className="h-3.5 w-3.5" />开始回答</>}
                </Button>
                <Button
                  size="sm" className="gap-1.5 px-4"
                  onClick={handleSubmit}
                  disabled={!finalTranscript.trim() || isListening}
                >
                  <Send className="h-3.5 w-3.5" />提交
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                rows={3}
                placeholder="请用华文书写您的回答...（Ctrl+Enter 提交）"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmit(); }}}
                className="bg-white text-sm font-chinese resize-none"
              />
              <Button size="sm" className="w-full gap-1.5" onClick={handleSubmit} disabled={!textAnswer.trim()}>
                <Send className="h-3.5 w-3.5" />提交回答
              </Button>
            </div>
          )}

          {/* Character count */}
          {currentAnswer.length > 0 && (
            <p className="text-right text-[10px] text-indigo-400">{currentAnswer.replace(/\s/g, '').length} 字</p>
          )}
        </div>
      )}
    </div>
  );
}
