'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Send, Loader2, BookOpen, RotateCcw, Lightbulb,
  Mic, Square, Star, TrendingUp, Repeat2, MessageSquare,
  Volume2, VolumeX, PhoneOff,
} from 'lucide-react';
import { TOPICS, COLOR_MAP } from '@/lib/topics';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Feedback {
  strength: string;
  improve: string;
  vocab: string | null;
  overall: string;
}

const TIPS = [
  '试试用"一方面……另一方面……"表达两面观点',
  '可以用"我认为……因为……"来表达意见',
  '尝试举一个具体的例子来支持你的观点',
  '你也可以谈谈这对新加坡社会的影响',
  '试试反问自己：有没有人会不同意你的观点？',
];

/* ── Small UI components ──────────────────────────────────────────── */

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="h-2.5 w-2.5 rounded-full bg-slate-400"
          style={{ animation: 'tdot 1.2s infinite ease-in-out', animationDelay: `${i * 0.2}s` }}
        />
      ))}
      <style>{`@keyframes tdot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}`}</style>
    </div>
  );
}

function SoundWave({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-end gap-[3px]', className)}>
      {[0.5, 0.9, 0.6, 1, 0.7, 0.9, 0.5].map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-current"
          style={{
            height: `${h * 16}px`,
            animation: `sw 0.7s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.09}s`,
          }}
        />
      ))}
      <style>{`@keyframes sw{from{transform:scaleY(0.25)}to{transform:scaleY(1)}}`}</style>
    </div>
  );
}

function FeedbackCard({ feedback, colors, onRestart }: {
  feedback: Feedback;
  colors: (typeof COLOR_MAP)[keyof typeof COLOR_MAP];
  onRestart: () => void;
}) {
  return (
    <div className="mx-2 my-4 rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-indigo-500" />
        <p className="text-base font-bold text-indigo-700">练习反馈</p>
      </div>
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">做得好</p>
            <p className="text-base text-emerald-800 font-chinese leading-relaxed">{feedback.strength}</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">可以改进</p>
            <p className="text-base text-amber-800 font-chinese leading-relaxed">{feedback.improve}</p>
          </div>
        </div>
      </div>
      {feedback.vocab && (
        <div className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <Repeat2 className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-1">词汇升级</p>
              <p className="text-base text-violet-800 font-chinese leading-relaxed">{feedback.vocab}</p>
            </div>
          </div>
        </div>
      )}
      <p className="text-base text-center text-slate-500 font-chinese italic">{feedback.overall}</p>
      <button
        onClick={onRestart}
        className={cn(
          'w-full rounded-xl py-3 text-base font-semibold font-chinese transition-all',
          colors.bg, colors.border, 'border-2', colors.text, 'hover:opacity-80'
        )}
      >
        再练一次 ↩
      </button>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */

export default function PracticePage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const studentName = searchParams.get('name') ?? '同学';
  const studentClass = searchParams.get('class') ?? '';

  const topic = TOPICS.find(t => t.id === topicId);
  const colors = topic ? COLOR_MAP[topic.color] : COLOR_MAP.blue;

  // ── State ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const [tipIndex, setTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);

  // Voice input
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const capturedFinalRef = useRef('');   // final (non-interim) speech text
  const micBlockedRef = useRef(false);   // true once permission denied

  // TTS
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Refs for stale-closure-safe callbacks ──
  const isLoadingRef = useRef(false);
  const ttsEnabledRef = useRef(true);
  const messagesRef = useRef<Message[]>([]);
  // sendMessage ref — updated after every render via a no-dep effect
  const sendMessageRef = useRef<(text: string) => void>(() => {});
  // startListeningRef kept as a no-op to satisfy HMR module continuity
  const startListeningRef = useRef<() => void>(() => {});

  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Browser support check
  useEffect(() => {
    const SR = window.SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    setVoiceSupported(!!SR);
    setTtsSupported(!!window.speechSynthesis);
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, feedback]);

  /* ── TTS ────────────────────────────────────────────────────────── */
  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    if (!ttsEnabledRef.current) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    const applyVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const pick =
        voices.find(v => v.lang === 'zh-CN' && v.name.includes('Google')) ??
        voices.find(v => v.lang === 'zh-CN') ??
        voices.find(v => v.lang.startsWith('zh'));
      if (pick) utterance.voice = pick;
    };
    if (window.speechSynthesis.getVoices().length) applyVoice();
    else window.speechSynthesis.onvoiceschanged = applyVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []); // no deps — reads from refs only, keeping this stable

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  /* ── Save session ────────────────────────────────────────────────── */
  const saveSession = useCallback(async (msgs: Message[], completed = false) => {
    if (!topic) return;
    const lastUser = [...msgs].reverse().find(m => m.role === 'user');
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: sessionId,
        studentName,
        studentClass,
        topicId: topic.id,
        topicTitle: topic.title,
        messageCount: msgs.filter(m => m.role === 'user').length,
        startedAt: new Date().toISOString(),
        preview: lastUser?.content.slice(0, 80) ?? '',
        completed,
      }),
    }).catch(() => {});
  }, [sessionId, studentName, studentClass, topic]);

  /* ── Opening message ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!topic || messages.length > 0) return;
    const text = `${studentName}，你好！今天我们来聊聊《${topic.title}》这个话题。${topic.starterQuestion}`;
    const msg: Message = { role: 'assistant', content: text };
    setMessages([msg]);
    saveSession([msg]);
    setTimeout(() => speakText(text), 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  /* ── Voice input ─────────────────────────────────────────────────── */
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SR || isLoadingRef.current) return;

    stopSpeaking();
    capturedFinalRef.current = ''; // reset transcript for this turn

    const recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) capturedFinalRef.current += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInput(capturedFinalRef.current + interim);
    };

    // Auto-restart to keep listening through natural pauses
    recognition.onend = () => {
      if (recognitionRef.current) {
        try { recognition.start(); } catch { /* already running */ }
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        micBlockedRef.current = true;
        setMicError('麦克风权限被浏览器阻止。请点击地址栏右边的🔒或麦克风图标 → 将麦克风改为"允许" → 刷新页面。');
        setIsListening(false);
        recognitionRef.current = null;
      } else if (e.error !== 'no-speech') {
        setIsListening(false);
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [stopSpeaking]);

  // Stop mic and immediately submit whatever was captured
  const stopListeningAndSend = useCallback(() => {
    const text = capturedFinalRef.current.trim();
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // prevent auto-restart
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    if (text) sendMessageRef.current(text);
  }, []);

  // Plain stop (no send) — used internally when we need to stop without submitting
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  /* ── Send message ────────────────────────────────────────────────── */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoadingRef.current || !topic) return;

    stopListening();
    stopSpeaking();

    const userMsg: Message = { role: 'user', content: text.trim() };
    const updated = [...messagesRef.current, userMsg];

    setMessages(updated);
    setInput('');
    setIsLoading(true);
    isLoadingRef.current = true;
    setShowTip(false);
    setFeedback(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, topicId: topic.id }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (data.error) throw new Error(data.error);

      const reply = data.reply ?? '';
      const aiMsg: Message = { role: 'assistant', content: reply };
      const final = [...updated, aiMsg];
      setMessages(final);
      saveSession(final);
      speakText(reply); // 🔊 AI speaks → then auto-listens

      if (final.filter(m => m.role === 'user').length % 4 === 0) {
        setTipIndex(i => (i + 1) % TIPS.length);
        setShowTip(true);
      }
    } catch {
      const errMsg = '不好意思，我刚才没听清楚，你可以再说一次吗？';
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      speakText(errMsg);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [topic, saveSession, speakText, stopListening, stopSpeaking]);

  // Keep sendMessageRef always pointing to the latest sendMessage
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);
  // Keep startListeningRef current (no-op — auto-listen removed, kept for HMR stability)
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  /* ── End session & feedback ──────────────────────────────────────── */
  const handleEndSession = useCallback(async () => {
    if (!topic || isFetchingFeedback) return;
    setIsFetchingFeedback(true);
    setShowTip(false);
    stopListening();
    stopSpeaking();
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, topicTitle: topic.title, studentName }),
      });
      const data = await res.json() as { feedback?: Feedback };
      if (data.feedback) {
        setFeedback(data.feedback);
        saveSession(messages, true);
        setTimeout(() => speakText(data.feedback!.overall), 400);
      }
    } catch {
      setFeedback({ strength: '练习完成！', improve: '继续多练习。', vocab: null, overall: '加油！' });
    } finally {
      setIsFetchingFeedback(false);
    }
  }, [isFetchingFeedback, messages, saveSession, speakText, stopListening, stopSpeaking, studentName, topic]);

  /* ── Restart ─────────────────────────────────────────────────────── */
  const handleRestart = useCallback(() => {
    stopListening();
    stopSpeaking();
    setMessages([]);
    setInput('');
    setShowTip(false);
    setFeedback(null);
    if (!topic) return;
    const text = `好，我们再来一次！继续聊《${topic.title}》。${topic.starterQuestion}`;
    const msg: Message = { role: 'assistant', content: text };
    setMessages([msg]);
    saveSession([msg]);
    setTimeout(() => speakText(text), 400);
  }, [saveSession, speakText, stopListening, stopSpeaking, topic]);

  /* ── Render guard ────────────────────────────────────────────────── */
  if (!topic) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500 text-lg">找不到该话题</p>
      </div>
    );
  }

  const userTurns = messages.filter(m => m.role === 'user').length;
  const canEnd = userTurns >= 3 && !isLoading && !isFetchingFeedback && !feedback;
  const userBubbleColor = colors.text.replace('text-', 'bg-').replace('-700', '-600');

  // Index of the last AI message (for the speaking animation)
  let lastAiIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') { lastAiIdx = i; break; }
  }

  // Status label in the input area
  const statusLabel =
    micError ? '麦克风权限被阻止 — 请看上方提示'
    : isSpeaking ? 'AI 正在说话…'
    : isLoading || isFetchingFeedback ? '思考中…'
    : isListening ? '说完后，再次点击麦克风提交'
    : voiceSupported ? '点击麦克风，开始回答'
    : '请输入你的回答';

  return (
    <div className="flex flex-col h-screen bg-slate-50">

      {/* ── Header ── */}
      <header className={cn('shrink-0 border-b px-4 py-3 flex items-center gap-2', colors.bg, colors.border.replace('border', 'border-b'))}>
        <button
          onClick={() => router.push('/')}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/60 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{topic.icon}</span>
            <div>
              <h1 className={cn('text-base font-bold font-chinese leading-tight', colors.text)}>{topic.title}</h1>
              <p className="text-xs text-slate-500 leading-tight">
                {studentName}{studentClass ? ` · ${studentClass}` : ''} · {userTurns} 轮
              </p>
            </div>
          </div>
        </div>

        {/* TTS toggle */}
        {ttsSupported && (
          <button
            onClick={() => {
              const next = !ttsEnabled;
              setTtsEnabled(next);
              ttsEnabledRef.current = next;
              if (!next && isSpeaking) stopSpeaking();
            }}
            title={ttsEnabled ? '关闭语音' : '开启语音'}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border transition-all',
              ttsEnabled
                ? cn('border-2', colors.border, colors.bg, colors.text)
                : 'border-slate-200 text-slate-400 hover:bg-slate-50'
            )}
          >
            {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        )}

        {canEnd && (
          <button
            onClick={handleEndSession}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            结束
          </button>
        )}

        <button
          onClick={handleRestart}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/60 transition-colors"
          title="重新开始"
        >
          <RotateCcw className="h-4 w-4 text-slate-500" />
        </button>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>

            {/* AI avatar with speaking pulse */}
            {msg.role === 'assistant' && (
              <div className="relative mt-1 shrink-0">
                {isSpeaking && i === lastAiIdx && (
                  <>
                    <span className={cn(
                      'absolute inset-0 rounded-full animate-ping opacity-50',
                      colors.bg
                    )} />
                    <span className={cn(
                      'absolute -inset-1.5 rounded-full animate-ping opacity-25',
                      colors.bg
                    )} style={{ animationDelay: '0.35s' }} />
                  </>
                )}
                <div className={cn(
                  'relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2',
                  colors.bg, colors.border,
                  isSpeaking && i === lastAiIdx ? 'shadow-lg' : ''
                )}>
                  <BookOpen className={cn('h-5 w-5', colors.text)} />
                </div>
              </div>
            )}

            {/* Bubble */}
            <div className={cn(
              'max-w-[78%] rounded-2xl px-5 py-4 text-base font-chinese leading-[1.9] whitespace-pre-wrap shadow-sm',
              msg.role === 'assistant'
                ? 'rounded-tl-sm bg-white border border-slate-200 text-slate-800'
                : cn('rounded-tr-sm text-white', userBubbleColor)
            )}>
              {/* Inline sound-wave inside latest AI bubble while speaking */}
              {msg.role === 'assistant' && isSpeaking && i === lastAiIdx && (
                <div className={cn('mb-2', colors.text)}>
                  <SoundWave />
                </div>
              )}

              {msg.content}

              {/* Re-listen button */}
              {msg.role === 'assistant' && ttsSupported && !(isSpeaking && i === lastAiIdx) && (
                <button
                  onClick={() => speakText(msg.content)}
                  className={cn('mt-2 flex items-center gap-1 text-xs opacity-40 hover:opacity-80 transition-opacity', colors.text)}
                >
                  <Volume2 className="h-3 w-3" /> 重听
                </button>
              )}
            </div>

            {/* User avatar */}
            {msg.role === 'user' && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white text-base font-bold mt-1">
                {studentName.slice(0, 1)}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {(isLoading || isFetchingFeedback) && (
          <div className="flex gap-3 justify-start">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2', colors.bg, colors.border)}>
              <BookOpen className={cn('h-5 w-5', colors.text)} />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-5 py-4 shadow-sm">
              <TypingDots />
              {isFetchingFeedback && (
                <p className="text-sm text-slate-400 mt-2 font-chinese">正在生成练习反馈…</p>
              )}
            </div>
          </div>
        )}

        {/* Tip card */}
        {showTip && !isLoading && (
          <div className="flex justify-center">
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-5 py-3.5 max-w-sm">
              <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-base text-amber-700 font-chinese leading-relaxed">{TIPS[tipIndex]}</p>
            </div>
          </div>
        )}

        {feedback && <FeedbackCard feedback={feedback} colors={colors} onRestart={handleRestart} />}

        <div ref={scrollRef} />
      </div>

      {/* ── Voice-first input bar ── */}
      {!feedback && (
        <div className="shrink-0 border-t border-slate-200 bg-white">

          {/* Mic permission error banner */}
          {micError && (
            <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <span className="text-lg shrink-0">🎙️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700 font-chinese">麦克风权限被阻止</p>
                <p className="text-xs text-red-600 font-chinese mt-0.5 leading-relaxed">
                  请点击浏览器地址栏右侧的 🔒 图标 → 找到"麦克风"→ 选择"允许"→ 刷新页面
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="shrink-0 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                刷新
              </button>
            </div>
          )}

          {/* Status label */}
          <div className="flex items-center justify-center gap-2 pt-3 pb-1">
            {isSpeaking && (
              <span className={cn('flex items-center gap-1', colors.text)}>
                <SoundWave />
              </span>
            )}
            {isListening && !isSpeaking && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
            <p className={cn(
              'text-sm font-chinese font-medium transition-colors',
              isSpeaking ? colors.text
                : isListening ? 'text-red-500'
                : 'text-slate-400'
            )}>
              {statusLabel}
            </p>
          </div>

          {/* Controls */}
          <div className="px-4 pb-4 pt-2">
            <div className="flex items-center justify-center gap-5">

              {/* Big mic button — primary CTA */}
              {voiceSupported && (
                <button
                  onClick={isListening ? stopListeningAndSend : startListening}
                  disabled={isLoading || isSpeaking || !!micError}
                  title={micError ? '麦克风权限被阻止，请刷新页面' : isListening ? '完成，提交回答' : '开始说话'}
                  className={cn(
                    'relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full transition-all duration-200 shadow-md',
                    isListening
                      ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-200'
                      : isLoading || isSpeaking
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                      : cn('text-white shadow-lg hover:scale-105 active:scale-95', userBubbleColor)
                  )}
                >
                  {isListening && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                      <span className="absolute -inset-2 rounded-full bg-red-300 animate-ping opacity-15" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                  {isListening
                    ? <Square className="h-8 w-8 fill-current relative z-10" />
                    : <Mic className="h-8 w-8 relative z-10" />
                  }
                </button>
              )}

              {/* Text input toggle */}
              <button
                onClick={() => setShowTextInput(v => !v)}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all',
                  showTextInput
                    ? cn(colors.border, colors.bg, colors.text)
                    : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                )}
                title="文字输入"
              >
                <MessageSquare className="h-5 w-5" />
              </button>

              {/* End session */}
              {canEnd && (
                <button
                  onClick={handleEndSession}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-indigo-200 text-indigo-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  title="结束并获取反馈"
                >
                  <Star className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Expandable text area */}
            {showTextInput && (
              <div className="flex gap-2 items-end mt-3 max-w-lg mx-auto">
                <textarea
                  ref={inputRef}
                  rows={2}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="用华文输入回答…"
                  disabled={isLoading}
                  className="flex-1 resize-none rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-base font-chinese outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 leading-relaxed"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all border-2',
                    input.trim() && !isLoading
                      ? cn('text-white border-transparent shadow-sm hover:opacity-90', userBubbleColor)
                      : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                  )}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            )}

            <p className="text-center text-xs text-slate-300 mt-3">
              AI助手仅供练习参考，不代表SEAB考试标准
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
