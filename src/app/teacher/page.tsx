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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-5 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">教师仪表板</h1>
              <p className="text-[10px] text-slate-400 leading-tight">实时跟踪学生练习情况</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLastRefresh(Date.now())}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> 刷新
            </button>
            {sessions.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> 清除
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '练习人次', value: sessions.length, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
            { label: '对话轮次', value: totalTurns, icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
            { label: '已完成反馈', value: completedCount, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl bg-white border border-slate-200 p-4 flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 tabular-nums leading-tight">{stat.value}</p>
                <p className="text-[11px] text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Student entry URL card */}
        {siteUrl && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <LinkIcon className="h-4 w-4 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-indigo-700">学生练习入口（把这个链接发给学生）</p>
                <p className="text-xs text-indigo-400 font-mono truncate mt-0.5">{siteUrl}</p>
              </div>
            </div>
            <button
              onClick={handleCopyUrl}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              {copiedUrl ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedUrl ? '已复制！' : '复制链接'}
            </button>
          </div>
        )}

        {/* Popular topics */}
        {topTopics.length > 0 && (
          <div className="rounded-xl bg-white border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-700 mb-3">热门话题</h2>
            <div className="space-y-2">
              {topTopics.map(([topicId, count]) => {
                const t = TOPICS.find(x => x.id === topicId);
                if (!t) return null;
                const c = COLOR_MAP[t.color];
                const pct = Math.round((count / sessions.length) * 100);
                return (
                  <div key={topicId} className="flex items-center gap-3">
                    <span className="text-xl w-7 text-center shrink-0">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn('text-xs font-semibold font-chinese', c.text)}>{t.title}</span>
                        <span className="text-xs text-slate-400 tabular-nums">{count} 人</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className={cn('h-full rounded-full', c.text.replace('text-', 'bg-').replace('-700', '-400'))} style={{ width: `${pct}%` }} />
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
            <span className="text-xs text-slate-500">筛选班级：</span>
            <button
              onClick={() => setClassFilter('')}
              className={cn('rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                classFilter === '' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              全部 ({sessions.length})
            </button>
            {availableClasses.map(cls => (
              <button
                key={cls}
                onClick={() => setClassFilter(cls)}
                className={cn('rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  classFilter === cls ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
              >
                {cls} ({sessions.filter(s => s.studentClass === cls).length})
              </button>
            ))}
          </div>
        )}

        {/* Student sessions list */}
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">
              学生练习记录
              {classFilter && <span className="ml-1.5 text-indigo-500">— {classFilter}</span>}
            </h2>
            <span className="text-xs text-slate-400">每15秒自动刷新</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-5 w-5 animate-spin text-slate-300" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-6">
              <div className="text-4xl">📋</div>
              <p className="text-sm font-semibold text-slate-600 font-chinese">暂无练习记录</p>
              <p className="text-xs text-slate-400 font-chinese">学生开始练习后，记录会在这里实时显示</p>
              {siteUrl && (
                <button
                  onClick={handleCopyUrl}
                  className="mt-1 flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-500 hover:bg-indigo-100 transition-colors"
                >
                  {copiedUrl ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="font-mono">{siteUrl}</span>
                  <span className="ml-1">{copiedUrl ? '已复制！' : '点击复制'}</span>
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
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    >
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base', c.bg, c.border, 'border')}>
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
                      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-2">
                        {s.preview && (
                          <div className="rounded-lg bg-white border border-slate-200 px-4 py-3">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">最后回答</p>
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
