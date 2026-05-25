import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    prep: '备考空间',
    ready_to_record: '准备录音',
    recording: '口头报告',
    processing: '分析中',
    discussion: '互动讨论',
    completed: '考试完成',
  };
  return labels[phase] ?? phase;
}

export function getPhaseStep(phase: string): number {
  const steps: Record<string, number> = {
    prep: 1,
    ready_to_record: 2,
    recording: 2,
    processing: 3,
    discussion: 3,
    completed: 4,
  };
  return steps[phase] ?? 1;
}

export function extractJsonFromText(text: string): unknown {
  // Handles Claude responses that wrap JSON in markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }
  // Try raw JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('No valid JSON found in response');
}
