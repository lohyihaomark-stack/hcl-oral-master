'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle2, ArrowRight, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OralAssignment } from '@/lib/types';

// Mock assignments for the dashboard
const MOCK_ASSIGNMENTS: (OralAssignment & { status: 'pending' | 'completed'; score?: number })[] = [
  {
    id: 'mock-001',
    title: '社交媒体对青少年的影响',
    video_url: '',
    stimulus_description: '录像展示了青少年使用社交媒体的场景...',
    prompt_text: '请分析社交媒体对青少年人际关系的利与弊。',
    teacher_id: null,
    class_targets: ['2A'],
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    status: 'pending',
  },
  {
    id: 'mock-002',
    title: '环境保护与个人责任',
    video_url: '',
    stimulus_description: '录像展示了海洋污染的景象...',
    prompt_text: '个人在环境保护中应承担怎样的责任？',
    teacher_id: null,
    class_targets: ['2A'],
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    status: 'completed',
    score: 34,
  },
];

export default function StudentDashboardPage() {
  const pending = MOCK_ASSIGNMENTS.filter((a) => a.status === 'pending');
  const completed = MOCK_ASSIGNMENTS.filter((a) => a.status === 'completed');

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span className="font-bold text-slate-800">高级华文口试大师</span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">退出</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-chinese">学生控制台</h1>
          <p className="text-slate-500 text-sm mt-1 font-chinese">欢迎回来，SEC2_HCL_01</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '待完成题目', value: pending.length, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: '已完成题目', value: completed.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: '平均得分', value: completed.length ? Math.round(completed.reduce((s, a) => s + (a.score ?? 0), 0) / completed.length) + '/40' : '--', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map((stat) => (
            <Card key={stat.label} className={stat.bg + ' border-0'}>
              <CardContent className="pt-4 pb-3">
                <p className={`text-2xl font-black tabular-nums ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 font-chinese mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending assignments */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">待完成</h2>
          <div className="space-y-3">
            {pending.map((a) => (
              <Card key={a.id} className="border-2 border-indigo-100 hover:border-indigo-300 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 font-chinese">{a.title}</p>
                      <p className="text-xs text-slate-500">截止日期：{fmtDate(a.due_date!)}</p>
                    </div>
                  </div>
                  <Link href={`/student/practice/${a.id}`}>
                    <Button size="sm" className="gap-1.5">
                      开始练习 <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {pending.length === 0 && (
              <p className="text-sm text-slate-400 italic font-chinese">暂无待完成题目</p>
            )}
          </div>
        </section>

        {/* Completed assignments */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">已完成</h2>
          <div className="space-y-3">
            {completed.map((a) => (
              <Card key={a.id} className="border border-slate-200">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 font-chinese">{a.title}</p>
                      <p className="text-xs text-slate-400">已完成</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-800 tabular-nums">{a.score}/40</p>
                      <Badge variant={a.score! >= 32 ? 'success' : a.score! >= 24 ? 'info' : 'warning'} className="text-xs">
                        {a.score! >= 36 ? 'A1' : a.score! >= 32 ? 'A2' : a.score! >= 28 ? 'B3' : 'B4'}
                      </Badge>
                    </div>
                    <Link href={`/student/practice/${a.id}`}>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Trophy className="h-3.5 w-3.5" /> 查看报告
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
