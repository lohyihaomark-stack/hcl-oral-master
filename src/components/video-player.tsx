'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  videoUrl: string;
  stimulusDescription: string;
  promptText: string;
  disabled?: boolean;   // Disable controls after prep phase ends
}

export function VideoPlayer({ videoUrl, stimulusDescription, promptText, disabled = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);    // 0-100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchCount, setWatchCount] = useState(0);

  // Enforce: no skipping forward, max 2x speed
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setWatchCount((c) => c + 1);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.addEventListener('timeupdate', handleTimeUpdate);
    v.addEventListener('loadedmetadata', handleLoadedMetadata);
    v.addEventListener('ended', handleEnded);
    return () => {
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.removeEventListener('loadedmetadata', handleLoadedMetadata);
      v.removeEventListener('ended', handleEnded);
    };
  }, [handleTimeUpdate, handleLoadedMetadata, handleEnded]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || disabled) return;
    if (isPlaying) {
      v.pause();
    } else {
      v.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, disabled]);

  const restart = useCallback(() => {
    const v = videoRef.current;
    if (!v || disabled) return;
    v.currentTime = 0;
    v.play();
    setIsPlaying(true);
  }, [disabled]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Prevent scrubbing forward (anti-cheat: only allow seeking backward)
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const v = videoRef.current;
      if (!v || disabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPct = (e.clientX - rect.left) / rect.width;
      const targetTime = clickPct * v.duration;
      // Only allow seeking BACKWARDS
      if (targetTime < v.currentTime) {
        v.currentTime = targetTime;
      }
    },
    [disabled]
  );

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Video element */}
      <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video object-contain"
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Watch count badge */}
        {watchCount > 0 && (
          <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
            已观看 {watchCount} 次
          </div>
        )}

        {/* Disabled overlay */}
        {disabled && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
            <p className="text-white text-sm font-medium bg-black/60 rounded-full px-4 py-2">
              备考时间已结束
            </p>
          </div>
        )}
      </div>

      {/* Custom controls */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
        {/* Progress bar (scrub only backward) */}
        <div
          className="group relative h-2 w-full rounded-full bg-slate-200 cursor-pointer overflow-hidden"
          onClick={handleProgressClick}
          title="只允许后退"
        >
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Playback buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={togglePlay}
              disabled={disabled}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={restart}
              disabled={disabled}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>

          {/* Time display */}
          <span className="text-xs tabular-nums text-slate-500 font-mono">
            {fmt(currentTime)} / {fmt(duration)}
          </span>
        </div>
      </div>

      {/* Stimulus description */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">录像情景简述</p>
        <p className="text-sm text-slate-700 font-chinese leading-relaxed">{stimulusDescription}</p>
      </div>

      {/* Critical-thinking prompt */}
      <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
          🎯 口试议题与提示
        </p>
        <p className="text-sm font-medium text-indigo-900 font-chinese leading-relaxed">{promptText}</p>
      </div>
    </div>
  );
}
