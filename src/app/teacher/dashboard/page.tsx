'use client';

import Link from 'next/link';
import { GraduationCap, Users, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// Mock cohort analytics
const COHORT_STATS = {
  totalStudents: 32,
  completedCount: 24,
  averageScore: 28.5,
  distribution: { A: 6, B: 10, C: 7, F: 1 },
  commonErrors: ['量词错用', '填充词过多（然后/那个）', '主谓不一致', '句式单调'],
  commonTags: ['框架完整', '词汇单调', '思辨力强', '结语薄弱'],
};

export default function TeacherDashboardPage() {
  const completionRate = Math.round((COHORT_STATS.completedCount / COHORT_STATS.totalStudents) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-violet-600" />
            <span className="font-bold text-slate-800">高级华文口试大师 — 教师控制台</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">教师</Badge>
            <Link href="/"><Button variant="ghost" size="sm">退出</Button></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 font-chinese">班级表现总览</h1>
          <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4" /> 新建口试题目
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '班级人数', value: COHORT_STATS.totalStudents, icon: <Users className="h-4 w-4" />, color: 'text-slate-700' },
            { label: '已完成', value: `${COHORT_STATS.completedCount}人`, icon: <TrendingUp className="h-4 w-4" />, color: 'text-emerald-700' },
            { label: '平均分', value: `${COHORT_STATS.averageScore}/40`, icon: <TrendingUp className="h-4 w-4" />, color: 'text-indigo-700' },
            { label: '常见错误', value: `${COHORT_STATS.commonErrors.length}类`, icon: <AlertCircle className="h-4 w-4" />, color: 'text-amber-700' },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-3">
                <div className={`flex items-center gap-1.5 ${kpi.color} mb-1`}>{kpi.icon}<span className="text-xs font-medium">{kpi.label}</span></div>
                <p className={`text-2xl font-black ${kpi.color} tabular-nums`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completion progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-chinese">完成进度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{COHORT_STATS.completedCount} / {COHORT_STATS.totalStudents} 名学生已完成</span>
              <span className="font-bold">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grade distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-chinese">成绩分布</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(COHORT_STATS.distribution).map(([grade, count]) => {
                const pct = Math.round((count / COHORT_STATS.completedCount) * 100);
                const color = grade === 'A' ? 'bg-emerald-500' : grade === 'B' ? 'bg-blue-500' : grade === 'C' ? 'bg-amber-500' : 'bg-red-500';
                return (
                  <div key={grade} className="flex items-center gap-3">
                    <span className="w-6 text-xs font-bold text-slate-700 font-mono">{grade}</span>
                    <div className="flex-1 h-5 rounded bg-slate-100 overflow-hidden">
                      <div className={`h-full ${color} rounded transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-xs text-slate-500 text-right">{count}人 ({pct}%)</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Common errors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-chinese flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />班级常见问题
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {COHORT_STATS.commonErrors.map((err, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm font-chinese text-red-700">
                  <span className="text-xs font-bold">#{i + 1}</span> {err}
                </div>
              ))}
              <Separator />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COHORT_STATS.commonTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-chinese">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Individual student list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-chinese">个别学生报告</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {([34, 28, 36, 22, 30] as const).map((score, i) => {
                const id = `SEC2_HCL_${String(i + 1).padStart(2, '0')}`;
                return (
                  <div key={id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{id}</span>
                      <Badge variant={score >= 32 ? 'success' : score >= 24 ? 'info' : 'warning'} className="text-xs">
                        {score}/40
                      </Badge>
                    </div>
                    <Link href={`/teacher/grading/session-${i}`}>
                      <Button size="sm" variant="ghost" className="text-xs">查看详情 →</Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
