'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Send, Loader2, BookOpen, RotateCcw, Lightbulb,
  Mic, Square, Star, TrendingUp, Repeat2, MessageSquare,
  Volume2, VolumeX,
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

function FeedbackCard({ feedback, colors, onRestart, onChangeTopic, turns }: {
  feedback: Feedback;
  colors: (typeof COLOR_MAP)[keyof typeof COLOR_MAP];
  onRestart: () => void;
  onChangeTopic: () => void;
  turns: number;
}) {
  return (
    <div className="my-4 rounded-3xl border border-slate-100 bg-white p-6 space-y-4 shadow-lift animate-scale-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
            <Star className="h-4 w-4 text-white fill-current" />
          </div>
          <p className="text-lg font-bold text-slate-800 font-chinese">练习反馈</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 font-chinese">
          完成 {turns} 轮对话
        </span>
      </div>
      <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 mb-1 font-chinese">做得好 👍</p>
            <p className="text-base text-emerald-900 font-chinese leading-relaxed">{feedback.strength}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-amber-50/70 border border-amber-100 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <Lightbulb className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-600 mb-1 font-chinese">可以改进 ✨</p>
            <p className="text-base text-amber-900 font-chinese leading-relaxed">{feedback.improve}</p>
          </div>
        </div>
      </div>
      {feedback.vocab && (
        <div className="rounded-2xl bg-violet-50/70 border border-violet-100 px-4 py-3.5">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100">
              <Repeat2 className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-violet-600 mb-1 font-chinese">词汇升级 📚</p>
              <p className="text-base text-violet-900 font-chinese leading-relaxed">{feedback.vocab}</p>
            </div>
          </div>
        </div>
      )}
      <p className="text-base text-center text-slate-500 font-chinese italic pt-1">{feedback.overall}</p>
      <div className="flex gap-3 pt-1">
        <button
          onClick={onChangeTopic}
          className="flex-1 rounded-2xl py-3 text-base font-semibold font-chinese transition-all border-2 border-slate-200 text-slate-500 hover:bg-slate-50"
        >
          换个话题
        </button>
        <button
          onClick={onRestart}
          className={cn(
            'flex-1 rounded-2xl py-3 text-base font-semibold font-chinese text-white transition-all bg-gradient-to-br shadow-md hover:opacity-90',
            colors.gradient
          )}
        >
          再练一次 ↩
        </button>
      </div>
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
  const selectedSubtopic = searchParams.get('subtopic') ?? '';

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

  // Restart confirmation
  const [confirmRestart, setConfirmRestart] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // No speech recognition (e.g. iPhone Safari) → open the text input so the
    // student isn't stranded with no visible way to answer.
    if (!SR) setShowTextInput(true);
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

    // Strip symbols that sound robotic when read aloud
    const cleaned = text
      .replace(/《([^》]*)》/g, '$1')        // 《话题》→ 话题
      .replace(/[【】「」『』""'']/g, '')     // remove CJK brackets/quotes
      .replace(/……/g, '，')                  // ellipsis → short pause
      .replace(/\.\.\./g, '，')              // ASCII ellipsis → pause
      .replace(/[*_~`#]/g, '')              // strip any markdown
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;    // natural conversational speed
    utterance.pitch = 1.0;   // natural pitch
    utterance.volume = 1;

    const applyVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const pick =
        // Microsoft neural voices (Edge on Windows — best quality by far)
        voices.find(v => /Xiaoxiao/i.test(v.name)) ??      // female neural, very natural
        voices.find(v => /Xiaoyi/i.test(v.name)) ??        // female neural alt
        voices.find(v => /Yunxi/i.test(v.name)) ??         // male neural
        voices.find(v => /Yunjian/i.test(v.name)) ??       // male neural alt
        voices.find(v => /YunJia/i.test(v.name)) ??
        // Google neural (Chrome on Windows/Android — decent)
        voices.find(v => (v.lang === 'zh-CN' || v.lang === 'zh_CN') && /Google/i.test(v.name)) ??
        // Any Microsoft zh-CN (older but still better than generic)
        voices.find(v => (v.lang === 'zh-CN' || v.lang === 'zh_CN') && /Microsoft/i.test(v.name)) ??
        // Fallback: any Mandarin voice
        voices.find(v => v.lang === 'zh-CN') ??
        voices.find(v => v.lang === 'zh_CN') ??
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
    const angleLine = selectedSubtopic ? `，今天重点聊聊"${selectedSubtopic}"这个角度` : '';
    const text = `${studentName}，你好！今天我们来聊聊${topic.title}${angleLine}。${topic.starterQuestion}`;
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
        body: JSON.stringify({ messages: updated, topicId: topic.id, subtopic: selectedSubtopic }),
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
    const angleLine = selectedSubtopic ? `，还是聊"${selectedSubtopic}"这个角度` : '';
    const text = `好，我们再来一次！继续聊${topic.title}${angleLine}。${topic.starterQuestion}`;
    const msg: Message = { role: 'assistant', content: text };
    setMessages([msg]);
    saveSession([msg]);
    setTimeout(() => speakText(text), 400);
  }, [saveSession, speakText, stopListening, stopSpeaking, topic]);

  /* ── Restart with confirmation ──────────────────────────────────── */
  const handleRestartClick = useCallback(() => {
    if (!confirmRestart) {
      setConfirmRestart(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmRestart(false), 3000);
    } else {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      setConfirmRestart(false);
      handleRestart();
    }
  }, [confirmRestart, handleRestart]);

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
  const userGradient = cn('bg-gradient-to-br', colors.gradient);

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
    <div className="flex flex-col h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50/40">

      {/* ── Header ── */}
      <header className="shrink-0 glass border-b border-white/60 px-3 sm:px-4 py-2.5 flex items-center gap-2">
        <button
          onClick={() => router.push('/')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-1 min-w-0 items-center gap-2.5">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl shadow-md', colors.gradient, colors.glow)}>
            {topic.icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold font-chinese leading-tight text-slate-800 truncate">{topic.title}</h1>
            <p className="text-xs text-slate-400 leading-tight truncate">
              {studentName}{studentClass ? ` · ${studentClass}` : ''} · {userTurns} 轮
            </p>
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
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all',
              ttsEnabled
                ? cn('bg-gradient-to-br text-white shadow-md', colors.gradient)
                : 'text-slate-400 hover:bg-slate-100'
            )}
          >
            {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        )}

        <button
          onClick={handleRestartClick}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all',
            confirmRestart
              ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
              : 'text-slate-400 hover:bg-slate-100'
          )}
          title={confirmRestart ? '再次点击确认重新开始' : '重新开始'}
        >
          <RotateCcw className="h-4 w-4" />
          {confirmRestart && <span className="font-chinese">确定？</span>}
        </button>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto scrollbar-soft px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-5">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-2.5 animate-fade-up', msg.role === 'user' ? 'justify-end' : 'justify-start')}>

            {/* AI avatar with speaking pulse */}
            {msg.role === 'assistant' && (
              <div className="relative mt-1 shrink-0">
                {isSpeaking && i === lastAiIdx && (
                  <>
                    <span className={cn('absolute inset-0 rounded-2xl bg-gradient-to-br animate-ping opacity-40', colors.gradient)} />
                    <span className={cn('absolute -inset-1.5 rounded-2xl bg-gradient-to-br animate-ping opacity-20', colors.gradient)} style={{ animationDelay: '0.35s' }} />
                  </>
                )}
                <div className={cn(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md',
                  colors.gradient, colors.glow,
                  isSpeaking && i === lastAiIdx ? 'shadow-lg' : ''
                )}>
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              </div>
            )}

            {/* Bubble */}
            <div className={cn(
              'max-w-[80%] px-5 py-3.5 text-base font-chinese leading-[1.85] whitespace-pre-wrap',
              msg.role === 'assistant'
                ? 'rounded-3xl rounded-tl-md bg-white border border-slate-100 text-slate-800 shadow-soft'
                : cn('rounded-3xl rounded-tr-md text-white shadow-md', userGradient, colors.glow)
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white text-base font-bold mt-1 shadow-md">
                {studentName.slice(0, 1)}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {(isLoading || isFetchingFeedback) && (
          <div className="flex gap-2.5 justify-start animate-fade-in">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md', colors.gradient)}>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="rounded-3xl rounded-tl-md bg-white border border-slate-100 px-5 py-4 shadow-soft">
              <TypingDots />
              {isFetchingFeedback && (
                <p className="text-sm text-slate-400 mt-2 font-chinese">正在生成练习反馈…</p>
              )}
            </div>
          </div>
        )}

        {/* Tip card */}
        {showTip && !isLoading && (
          <div className="flex justify-center animate-scale-in">
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-100 px-5 py-3.5 max-w-sm shadow-soft">
              <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-base text-amber-700 font-chinese leading-relaxed">{TIPS[tipIndex]}</p>
            </div>
          </div>
        )}

        {feedback && <FeedbackCard feedback={feedback} colors={colors} onRestart={handleRestart} onChangeTopic={() => router.push('/')} turns={userTurns} />}

        <div ref={scrollRef} />
        </div>
      </div>

      {/* ── Voice-first input bar ── */}
      {!feedback && (
        <div className="shrink-0 glass border-t border-white/60">

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
            <div className="flex items-center justify-center gap-4">

              {/* Text input toggle */}
              <button
                onClick={() => setShowTextInput(v => !v)}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl transition-all',
                  showTextInput
                    ? cn('bg-gradient-to-br text-white shadow-md', userGradient)
                    : 'bg-white text-slate-400 ring-1 ring-slate-200 hover:text-slate-600 hover:ring-slate-300'
                )}
                title="文字输入"
              >
                <MessageSquare className="h-5 w-5" />
              </button>

              {/* Big mic button — primary CTA */}
              {voiceSupported && (
                <button
                  onClick={isListening ? stopListeningAndSend : startListening}
                  disabled={isLoading || isSpeaking || !!micError}
                  title={micError ? '麦克风权限被阻止，请刷新页面' : isListening ? '完成，提交回答' : '开始说话'}
                  className={cn(
                    'relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full transition-all duration-200',
                    isListening
                      ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white scale-110 shadow-glow'
                      : isLoading || isSpeaking
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      : cn('text-white shadow-glow hover:scale-105 active:scale-95 bg-gradient-to-br', colors.gradient)
                  )}
                >
                  {isListening && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-30" />
                      <span className="absolute -inset-2 rounded-full bg-rose-300 animate-ping opacity-15" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                  {isListening
                    ? <Square className="h-7 w-7 fill-current relative z-10" />
                    : <Mic className="h-8 w-8 relative z-10" />
                  }
                </button>
              )}

              {/* End session — always visible; shows countdown until unlocked */}
              <button
                onClick={canEnd ? handleEndSession : undefined}
                disabled={!canEnd || isLoading || isFetchingFeedback}
                title={canEnd ? '结束练习，获取AI反馈' : `再 ${Math.max(0, 3 - userTurns)} 轮后可获取反馈`}
                className={cn(
                  'flex h-12 flex-col items-center justify-center rounded-2xl px-3 transition-all gap-0',
                  canEnd
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md hover:scale-105 cursor-pointer'
                    : 'bg-white text-slate-300 ring-1 ring-slate-200 cursor-default'
                )}
              >
                <Star className={cn('h-4 w-4', canEnd && 'fill-current')} />
                <span className="text-[10px] font-semibold font-chinese leading-tight mt-0.5">
                  {canEnd ? '获取反馈' : `${Math.max(0, 3 - userTurns)}轮后`}
                </span>
              </button>
            </div>

            {/* Expandable text area */}
            {showTextInput && (
              <div className="flex gap-2 items-end mt-4 max-w-lg mx-auto animate-scale-in">
                <textarea
                  ref={inputRef}
                  rows={2}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="用华文输入回答…"
                  disabled={isLoading}
                  className="flex-1 resize-none rounded-2xl border-2 border-slate-200 bg-white/80 px-4 py-3 text-base font-chinese outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 leading-relaxed"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all',
                    input.trim() && !isLoading
                      ? cn('text-white shadow-md hover:opacity-90 bg-gradient-to-br', userGradient)
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  )}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            )}

            <p className="text-center text-xs text-slate-300 mt-3 font-chinese">
              AI 助手仅供练习参考，不代表 SEAB 考试标准
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
