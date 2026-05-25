'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Square, Play, Pause, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn, formatTime } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';

const RECORD_DURATION = 120; // 2 minutes in seconds

interface Props {
  isActive: boolean;                                     // Set true when phase === 'recording'
  onRecordingComplete: (blob: Blob, url: string, transcript: string) => void;
  onTranscriptUpdate?: (text: string) => void;
  readonlyNotes?: React.ReactNode;                       // Prep notes shown during recording
}

type RecorderState = 'idle' | 'recording' | 'paused' | 'done';

export function AudioRecorder({
  isActive,
  onRecordingComplete,
  onTranscriptUpdate,
  readonlyNotes,
}: Props) {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [secondsLeft, setSecondsLeft] = useState(RECORD_DURATION);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fullTranscriptRef = useRef('');

  const { isSupported, isListening, finalTranscript, interimTranscript, startListening, stopListening, reset } =
    useSpeechRecognition({
      language: 'zh-TW',
      continuous: true,
      onFinalResult: (text) => {
        fullTranscriptRef.current += text;
        onTranscriptUpdate?.(fullTranscriptRef.current);
      },
    });

  // Volume visualisation via Web Audio API
  const startVolumeAnalysis = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setVolumeLevel(Math.min(100, avg * 2));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopVolumeAnalysis = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setVolumeLevel(0);
  }, []);

  // Countdown timer during recording
  useEffect(() => {
    if (recorderState !== 'recording') return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderState]);

  const startRecording = useCallback(async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      chunksRef.current = [];
      fullTranscriptRef.current = '';
      reset();

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecorderState('done');
        stopVolumeAnalysis();
        stream.getTracks().forEach((t) => t.stop());
        onRecordingComplete(blob, url, fullTranscriptRef.current);
      };

      recorder.start(500); // collect chunks every 500ms
      setRecorderState('recording');
      setSecondsLeft(RECORD_DURATION);
      startVolumeAnalysis(stream);
      if (isSupported) startListening();
    } catch (err) {
      setPermissionError('麦克风权限被拒绝。请在浏览器设置中允许麦克风访问后重试。');
    }
  }, [isSupported, onRecordingComplete, reset, startListening, startVolumeAnalysis, stopVolumeAnalysis]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopListening();
    stopVolumeAnalysis();
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
  }, [stopListening, stopVolumeAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVolumeAnalysis();
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [stopVolumeAnalysis]);

  const progressPct = ((RECORD_DURATION - secondsLeft) / RECORD_DURATION) * 100;
  const isUrgent = secondsLeft <= 30;

  return (
    <div className="flex flex-col gap-4">
      {/* Prep notes reference panel (read-only during recording) */}
      {readonlyNotes && recorderState !== 'idle' && (
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="mb-1 font-semibold">📝 备考笔记（参考用）</p>
          {readonlyNotes}
        </div>
      )}

      {/* Permission error */}
      {permissionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{permissionError}</AlertDescription>
        </Alert>
      )}

      {/* Main recorder card */}
      <div className={cn(
        'rounded-xl border-2 p-6 transition-all duration-300',
        recorderState === 'recording' && 'border-red-400 bg-red-50',
        recorderState === 'done' && 'border-green-400 bg-green-50',
        recorderState === 'idle' && 'border-slate-200 bg-slate-50',
      )}>
        {/* Timer display */}
        {recorderState === 'recording' && (
          <div className="mb-4">
            <div className={cn(
              'text-center text-5xl font-mono font-bold tabular-nums',
              isUrgent ? 'text-red-600 animate-pulse-slow' : 'text-slate-700'
            )}>
              {formatTime(secondsLeft)}
            </div>
            <p className="text-center text-xs text-slate-500 mt-1">
              {isUrgent ? '⚠️ 时间即将结束，请完成总结' : '剩余录音时间'}
            </p>

            {/* Progress bar */}
            <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-1000',
                  isUrgent ? 'bg-red-500' : 'bg-blue-500'
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Volume visualiser bars */}
        {recorderState === 'recording' && (
          <div className="flex items-end justify-center gap-[3px] h-12 mb-4">
            {Array.from({ length: 24 }).map((_, i) => {
              const barHeight = Math.max(4, (volumeLevel / 100) * 48 * (0.4 + 0.6 * Math.random()));
              return (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-blue-500 transition-all duration-75"
                  style={{ height: `${barHeight}px`, opacity: 0.7 + 0.3 * Math.random() }}
                />
              );
            })}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col items-center gap-3">
          {recorderState === 'idle' && (
            <Button
              onClick={startRecording}
              disabled={!isActive}
              size="lg"
              className="gap-2 bg-red-600 hover:bg-red-700 text-white px-8"
            >
              <Mic className="h-5 w-5" />
              开始录音
            </Button>
          )}

          {recorderState === 'recording' && (
            <div className="flex gap-3">
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="h-4 w-4 fill-current" />
                完成录音
              </Button>
            </div>
          )}

          {recorderState === 'done' && audioUrl && (
            <div className="w-full space-y-2">
              <p className="text-center text-sm font-medium text-green-700">✅ 录音完成</p>
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}
        </div>

        {/* Live transcript preview */}
        {recorderState === 'recording' && isSupported && (
          <div className="mt-4 rounded-lg bg-white/70 border border-blue-100 p-3 max-h-28 overflow-y-auto">
            <p className="text-xs text-blue-600 font-medium mb-1">🎙️ 实时转录</p>
            <p className="text-xs text-slate-600 font-chinese leading-relaxed">
              {finalTranscript}
              <span className="text-slate-400 italic">{interimTranscript}</span>
              {!finalTranscript && !interimTranscript && (
                <span className="text-slate-400">请开始发言...</span>
              )}
            </p>
          </div>
        )}

        {!isSupported && recorderState === 'recording' && (
          <p className="mt-3 text-center text-xs text-amber-600">
            ⚠️ 当前浏览器不支持实时转录，请使用 Chrome 或 Edge
          </p>
        )}
      </div>

      {recorderState === 'idle' && isActive && (
        <p className="text-center text-sm text-slate-500">
          点击上方按钮开始您的 <strong>2分钟口头报告</strong>。报告期间不会有任何提示。
        </p>
      )}
    </div>
  );
}
