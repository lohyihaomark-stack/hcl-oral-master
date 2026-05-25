'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight, GraduationCap, Users } from 'lucide-react';
import { TOPICS, COLOR_MAP } from '@/lib/topics';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cls, setCls] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleTopicClick = (topicId: string) => {
    setSelected(topicId);
    setShowModal(true);
  };

  const handleStart = () => {
    if (!name.trim()) return;
    const params = new URLSearchParams({ name: name.trim(), class: cls.trim() });
    router.push(`/practice/${selected}?${params.toString()}`);
  };

  const closeModal = () => {
    setShowModal(false);
    setName('');
    setCls('');
  };

  const topic = selected ? TOPICS.find(t => t.id === selected) : null;
  const c = topic ? COLOR_MAP[topic.color] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">华文口语练习</h1>
              <p className="text-[10px] text-slate-400 leading-tight">Higher Chinese Speaking Practice</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/teacher')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            教师仪表板
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="mx-auto max-w-5xl px-5 py-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-semibold text-indigo-700 mb-4">
          <GraduationCap className="h-3.5 w-3.5" />
          SEAB Higher Chinese Oral Practice
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-3 font-chinese">选择一个话题，开始练习！</h2>
        <p className="text-slate-500 text-base max-w-md mx-auto font-chinese">
          与AI助手用华文对话，练习口语表达，获得即时反馈。选一个你感兴趣的话题开始吧。
        </p>
      </div>

      {/* Topic Grid */}
      <div className="mx-auto max-w-5xl px-5 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TOPICS.map((t) => {
            const colors = COLOR_MAP[t.color];
            return (
              <button
                key={t.id}
                onClick={() => handleTopicClick(t.id)}
                className={cn(
                  'group relative flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 text-center transition-all duration-200 cursor-pointer',
                  colors.bg, colors.border, colors.hover,
                  'hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
                )}
              >
                <span className="text-4xl">{t.icon}</span>
                <div>
                  <p className={cn('text-base font-bold font-chinese', colors.text)}>{t.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2 font-chinese">{t.description}</p>
                </div>
                <div className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', colors.badge)}>
                  {t.subtopics.length} 个角度
                </div>
                <ChevronRight className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity', colors.text)} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal — name entry */}
      {showModal && topic && c && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className={cn('px-6 py-6', c.bg)}>
              <p className="text-4xl mb-3">{topic.icon}</p>
              <h3 className={cn('text-xl font-bold font-chinese', c.text)}>{topic.title}</h3>
              <p className="text-sm text-slate-500 mt-1 font-chinese">{topic.description}</p>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">你的名字 *</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="例：陈小明"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 font-chinese"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  班级 <span className="text-slate-400 font-normal">（选填）</span>
                </label>
                <input
                  type="text"
                  placeholder="例：2A"
                  value={cls}
                  onChange={e => setCls(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-base text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <Button className="flex-1 gap-1.5 text-base py-3 h-auto" disabled={!name.trim()} onClick={handleStart}>
                  开始练习 <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
