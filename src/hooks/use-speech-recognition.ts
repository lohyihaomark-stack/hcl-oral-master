'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Extend window type for vendor-prefixed Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface Options {
  language?: string;       // BCP-47 language tag, default 'zh-TW' for Mandarin
  continuous?: boolean;
  onFinalResult?: (text: string) => void;
  onInterimResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({
  language = 'zh-TW',
  continuous = true,
  onFinalResult,
  onInterimResult,
  onError,
}: Options = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    setIsSupported(true);
    const rec = new SR();
    rec.lang = language;
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }
      if (final && isMountedRef.current) {
        setFinalTranscript((prev) => prev + final);
        setInterimTranscript('');
        onFinalResult?.(final);
      }
      if (interim && isMountedRef.current) {
        setInterimTranscript(interim);
        onInterimResult?.(interim);
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!isMountedRef.current) return;
      setIsListening(false);
      const msg = event.error === 'no-speech' ? '未检测到语音，请靠近麦克风' : event.error;
      onError?.(msg);
    };

    rec.onend = () => {
      if (!isMountedRef.current) return;
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = rec;
    return () => {
      isMountedRef.current = false;
      rec.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, continuous]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setFinalTranscript('');
    setInterimTranscript('');
    recognitionRef.current.start();
    setIsListening(true);
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, [isListening]);

  const reset = useCallback(() => {
    setFinalTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isSupported,
    isListening,
    finalTranscript,
    interimTranscript,
    fullTranscript: finalTranscript + interimTranscript,
    startListening,
    stopListening,
    reset,
  };
}
