import { NextRequest, NextResponse } from 'next/server';
import { generateEvaluation } from '@/lib/claude-service';
import type { EvaluateRequest } from '@/lib/types';

const supabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_PROJECT');

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EvaluateRequest;
    const { transcript, discussion_log, session_id } = body;

    if (!transcript?.trim() || !session_id) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const evaluation = await generateEvaluation(transcript, discussion_log);

    if (supabaseConfigured() && session_id && !session_id.startsWith('mock')) {
      try {
        const { createSupabaseAdminClient } = await import('@/lib/supabase-client');
        const supabase = createSupabaseAdminClient();
        await supabase
          .from('student_sessions')
          .update({
            discussion_log: discussion_log as never,
            ai_evaluation: evaluation as never,
            total_score: evaluation.scores.total,
            phase: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', session_id);
      } catch (dbErr) {
        console.warn('[evaluate] Supabase update skipped:', dbErr);
      }
    }

    return NextResponse.json({ evaluation });
  } catch (err) {
    console.error('[/api/exam/evaluate]', err);
    const msg = err instanceof Error ? err.message : '未知错误';
    return NextResponse.json({ error: `生成评估时发生错误：${msg}` }, { status: 500 });
  }
}
