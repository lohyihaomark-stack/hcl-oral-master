'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, RefreshCw, Trash2, MessageSquare, Clock, BookOpen, CheckCircle2, Copy, ChevronDown, Link as LinkIcon } from 'lucide-react';
import { TOPICS, COLOR_MAP } from '@/lib/topics';
import { cn } from '@/lib/utils';

interface SessionRecord {
  id: string;
  studentName: string;
  studentClass: string;
  topicId: string;
  topicTitle: string;
  messageCount: number;
  startedAt: string;
  lastActiveAt: string;
  preview: string;
  completed: boolean;
}

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return '刚才';
  if (secs < 3600) return `${Math.floor(secs / 60)} 分钟前`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} 小时前`;
  return `${Math.floor(secs / 86400)} 天前`;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [siteUrl, setSiteUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState('');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json() as { sessions: SessionRecord[] };
      setSessions(data.sessions ?? []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, lastRefresh]);

  // Auto-refresh every 15s
  useEffect(() => {
    const id = setInterval(() => setLastRefresh(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  // Capture the real site URL (works on both localhost and Vercel)
  useEffect(() => {
    setSiteUrl(window.location.origin);
  }, []);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(siteUrl).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  };

  const handleClear = async () => {
    if (!confirm('确定要清除所有练习记录吗？')) return;
    await fetch('/api/sessions', { method: 'DELETE' });
    setSessions([]);
  };

  // Stats
  const topicCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.topicId] = (acc[s.topicId] ?? 0) + 1;
    return acc;
  }, {});
  const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalTurns = sessions.reduce((sum, s) => sum + s.messageCount, 0);
  const completedCount = sessions.filter(s => s.completed).length;

  // Class filter
  const availableClasses = [...new Set(sessions.map(s => s.studentClass).filter(Boolean))].sort() as string[];
  const filteredSessions = classFilter ? sessions.filter(s => s.studentClass === classFilter) : sessions;

  return (
    <div className="min-h-screen aurora">
      {/* Header */}
      <header className="sticky top-0 z-20 glass border-b border-white/60">
        <div className="mx-auto max-w-4xl px-5 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5 flex-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-glow">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight font-chinese">教师仪表板</h1>
              <p className="text-[10px] text-slate-400 leading-tight">实时跟踪学生练习情况</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLastRefresh(Date.now())}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white hover:border-indigo-200 transition-all"
            >
              <RefreshCw className="h-3 w-3" /> 刷新
            </button>
            {sessions.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 rounded-full border border-red-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-all"
              >
                <Trash2 className="h-3 w-3" /> 清除
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-6 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '练习人次', value: sessions.length, icon: Users, grad: 'from-indigo-500 to-violet-600' },
            { label: '对话轮次', value: totalTurns, icon: MessageSquare, grad: 'from-sky-400 to-blue-600' },
            { label: '已完成反馈', value: completedCount, icon: CheckCircle2, grad: 'from-emerald-400 to-green-600' },
          ].map((stat, i) => (
            <div key={stat.label} className="rounded-2xl bg-white border border-slate-100 p-4 flex items-center gap-3 shadow-soft animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md', stat.grad)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 tabular-nums leading-tight">{stat.value}</p>
                <p className="text-[11px] text-slate-500 font-chinese">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Student entry URL card */}
        {siteUrl && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 px-4 py-3.5 flex items-center justify-between gap-3 shadow-soft">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70 text-indigo-500">
                <LinkIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-indigo-700 font-chinese">学生练习入口（把这个链接发给学生）</p>
                <p className="text-xs text-indigo-400 font-mono truncate mt-0.5">{siteUrl}</p>
              </div>
            </div>
            <button
              onClick={handleCopyUrl}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-all"
            >
              {copiedUrl ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedUrl ? '已复制！' : '复制链接'}
            </button>
          </div>
        )}

        {/* Popular topics */}
        {topTopics.length > 0 && (
          <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-soft">
            <h2 className="text-sm font-bold text-slate-700 mb-3.5 font-chinese">热门话题</h2>
            <div className="space-y-3">
              {topTopics.map(([topicId, count]) => {
                const t = TOPICS.find(x => x.id === topicId);
                if (!t) return null;
                const c = COLOR_MAP[t.color];
                const pct = Math.round((count / sessions.length) * 100);
                return (
                  <div key={topicId} className="flex items-center gap-3">
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm shadow-sm', c.gradient)}>{t.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold font-chinese text-slate-700">{t.title}</span>
                        <span className="text-xs text-slate-400 tabular-nums">{count} 人</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', c.gradient)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Class filter */}
        {availableClasses.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-chinese">筛选班级：</span>
            <button
              onClick={() => setClassFilter('')}
              className={cn('rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                classFilter === '' ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300')}
            >
              全部 ({sessions.length})
            </button>
            {availableClasses.map(cls => (
              <button
                key={cls}
                onClick={() => setClassFilter(cls)}
                className={cn('rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                  classFilter === cls ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300')}
              >
                {cls} ({sessions.filter(s => s.studentClass === cls).length})
              </button>
            ))}
          </div>
        )}

        {/* Student sessions list */}
        <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-soft">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 font-chinese">
              学生练习记录
              {classFilter && <span className="ml-1.5 text-indigo-500">— {classFilter}</span>}
            </h2>
            <span className="text-xs text-slate-400 font-chinese">每 15 秒自动刷新</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-5 w-5 animate-spin text-slate-300" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-6">
              <div className="text-5xl">📋</div>
              <p className="text-sm font-semibold text-slate-600 font-chinese">暂无练习记录</p>
              <p className="text-xs text-slate-400 font-chinese">学生开始练习后，记录会在这里实时显示</p>
              {siteUrl && (
                <button
                  onClick={handleCopyUrl}
                  className="mt-1 flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs text-indigo-500 hover:bg-indigo-100 transition-colors"
                >
                  {copiedUrl ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="font-mono">{siteUrl}</span>
                  <span className="ml-1 font-chinese">{copiedUrl ? '已复制！' : '点击复制'}</span>
                </button>
              )}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <p className="text-sm text-slate-400 font-chinese">{classFilter} 班暂无记录</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSessions.map(s => {
                const t = TOPICS.find(x => x.id === s.topicId);
                const c = t ? COLOR_MAP[t.color] : COLOR_MAP.blue;
                const isExpanded = expandedId === s.id;
                return (
                  <div key={s.id}>
                    <button
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors text-left"
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    >
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-base shadow-sm', c.gradient)}>
                        {t?.icon ?? '💬'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800 font-chinese">{s.studentName}</span>
                          {s.studentClass && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{s.studentClass}</span>
                          )}
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold font-chinese', c.badge)}>
                            {s.topicTitle}
                          </span>
                          {s.completed && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">✓ 已完成</span>
                          )}
                        </div>
                        {s.preview && !isExpanded && (
                          <p className="text-xs text-slate-400 truncate mt-0.5 font-chinese">"{s.preview}"</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-1 text-xs text-slate-500 justify-end">
                          <MessageSquare className="h-3 w-3" />
                          {s.messageCount} 轮
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 justify-end mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {timeAgo(s.lastActiveAt)}
                        </div>
                      </div>
                      <ChevronDown className={cn('h-3.5 w-3.5 text-slate-300 shrink-0 transition-transform ml-1', isExpanded ? 'rotate-180' : '')} />
                    </button>

                    {/* Expanded detail panel */}
                    {isExpanded && (
                      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 space-y-2.5 animate-fade-in">
                        {s.preview && (
                          <div className="rounded-xl bg-white border border-slate-100 px-4 py-3 shadow-sm">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 font-chinese">最后回答</p>
                            <p className="text-sm text-slate-700 font-chinese leading-relaxed">"{s.preview}"</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 font-chinese">
                          <span>班级：<strong className="text-slate-700">{s.studentClass || '未填写'}</strong></span>
                          <span>话题：<strong className="text-slate-700">{s.topicTitle}</strong></span>
                          <span>对话轮次：<strong className="text-slate-700">{s.messageCount} 轮</strong></span>
                          <span>状态：<strong className={s.completed ? 'text-emerald-600' : 'text-amber-600'}>{s.completed ? '✓ 已完成反馈' : '练习中'}</strong></span>
                          <span>开始时间：<strong className="text-slate-700">{new Date(s.startedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
