import { NextRequest, NextResponse } from 'next/server';

// In-memory session store (persists while dev server runs)
// Replace with Supabase for production persistence
export interface SessionRecord {
  id: string;
  studentName: string;
  studentClass: string;
  topicId: string;
  topicTitle: string;
  messageCount: number;
  startedAt: string;
  lastActiveAt: string;
  preview: string; // last student message snippet
  completed: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __sessions: Map<string, SessionRecord> | undefined;
}

// Use globalThis so the store survives HMR reloads in dev
if (!global.__sessions) {
  global.__sessions = new Map<string, SessionRecord>();
}
const store = global.__sessions;

// POST  — upsert a session record
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<SessionRecord> & { id: string };
    const existing = store.get(body.id) ?? {};
    const updated: SessionRecord = { ...existing as SessionRecord, ...body, lastActiveAt: new Date().toISOString() };
    store.set(body.id, updated);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET   — return all sessions sorted by lastActiveAt desc
export async function GET() {
  const all = Array.from(store.values()).sort(
    (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
  );
  return NextResponse.json({ sessions: all });
}

// DELETE — clear all sessions (teacher reset)
export async function DELETE() {
  store.clear();
  return NextResponse.json({ ok: true });
}
