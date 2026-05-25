import { NextRequest, NextResponse } from 'next/server';
import { generateDiscussionQuestions } from '@/lib/claude-service';
import type { GenerateQuestionsRequest } from '@/lib/types';

const supabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_PROJECT');

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateQuestionsRequest;
    const { transcript, assignment_prompt, session_id } = body;

    if (!transcript?.trim() || !assignment_prompt?.trim()) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const questions = await generateDiscussionQuestions(transcript, assignment_prompt);

    if (supabaseConfigured() && session_id && !session_id.startsWith('mock')) {
      try {
        const { createSupabaseAdminClient } = await import('@/lib/supabase-client');
        const supabase = createSupabaseAdminClient();
        await supabase
          .from('student_sessions')
          .update({ oral_report_transcript: transcript, phase: 'discussion' })
          .eq('id', session_id);
      } catch (dbErr) {
        console.warn('[questions] Supabase update skipped:', dbErr);
      }
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error('[/api/exam/questions]', err);
    const msg = err instanceof Error ? err.message : '未知错误';
    return NextResponse.json({ error: `生成问题时发生错误：${msg}` }, { status: 500 });
  }
}
