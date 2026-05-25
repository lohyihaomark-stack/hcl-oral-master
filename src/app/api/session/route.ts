import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-client';

// POST — create or resume a student session for a given assignment
export async function POST(req: NextRequest) {
  try {
    const { student_id, assignment_id } = await req.json();
    if (!student_id || !assignment_id) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Upsert: if session exists, return it; otherwise create fresh
    const { data, error } = await supabase
      .from('student_sessions')
      .upsert(
        { student_id, assignment_id, phase: 'prep' },
        { onConflict: 'student_id,assignment_id', ignoreDuplicates: true }
      )
      .select()
      .single();

    if (error) {
      // Session already exists — fetch it
      const { data: existing, error: fetchErr } = await supabase
        .from('student_sessions')
        .select('*')
        .eq('student_id', student_id)
        .eq('assignment_id', assignment_id)
        .single();

      if (fetchErr) throw fetchErr;
      return NextResponse.json({ session: existing });
    }

    return NextResponse.json({ session: data });
  } catch (err) {
    console.error('[/api/session]', err);
    return NextResponse.json({ error: '会话创建失败' }, { status: 500 });
  }
}

// PATCH — update session phase or notes
export async function PATCH(req: NextRequest) {
  try {
    const { session_id, updates } = await req.json();
    if (!session_id) return NextResponse.json({ error: '缺少session_id' }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('student_sessions')
      .update(updates)
      .eq('id', session_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ session: data });
  } catch (err) {
    console.error('[/api/session PATCH]', err);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
