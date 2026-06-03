'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ChevronRight, Mic, GraduationCap, ArrowRight, X } from 'lucide-react';
import { TOPICS, COLOR_MAP } from '@/lib/topics';
import { cn } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cls, setCls] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleTopicClick = (topicId: string) => {
    setSelected(topicId);
    setSubtopic('');
    setShowModal(true);
  };

  const handleStart = () => {
    if (!name.trim()) return;
    const params = new URLSearchParams({ name: name.trim(), class: cls.trim() });
    if (subtopic) params.set('subtopic', subtopic);
    router.push(`/practice/${selected}?${params.toString()}`);
  };

  const closeModal = () => {
    setShowModal(false);
    setName('');
    setCls('');
    setSubtopic('');
  };

  const topic = selected ? TOPICS.find(t => t.id === selected) : null;
  const c = topic ? COLOR_MAP[topic.color] : null;

  return (
    <div className="min-h-screen aurora">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 glass border-b border-white/60">
        <div className="mx-auto max-w-6xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-glow">
              <Mic className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight font-chinese">华文口语练习</h1>
              <p className="text-[10px] text-slate-400 leading-tight tracking-wide">HIGHER CHINESE · SPEAKING</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/teacher')}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            教师入口
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-5 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 mb-5 animate-fade-up shadow-soft">
          <Sparkles className="h-3.5 w-3.5" />
          SEAB 高级华文口试 · AI 对话练习
        </div>
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.12] mb-4 font-chinese animate-fade-up"
          style={{ animationDelay: '60ms' }}
        >
          选个话题，<span className="text-gradient whitespace-nowrap">开口说华文</span>
        </h2>
        <p
          className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto font-chinese leading-relaxed animate-fade-up"
          style={{ animationDelay: '120ms' }}
        >
          和 AI 伙伴像朋友一样聊天，练习口语表达，结束后获得即时反馈。挑一个你感兴趣的话题，现在就开始吧。
        </p>
      </section>

      {/* ── Topic grid ── */}
      <main className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {TOPICS.map((t, i) => {
            const colors = COLOR_MAP[t.color];
            return (
              <button
                key={t.id}
                onClick={() => handleTopicClick(t.id)}
                style={{ animationDelay: `${140 + i * 45}ms` }}
                className="group relative flex flex-col items-start gap-3 rounded-3xl border border-slate-100 bg-white p-5 text-left shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift animate-fade-up"
              >
                <div className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3',
                  colors.gradient, colors.glow
                )}>
                  {t.icon}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-slate-800 font-chinese leading-tight">{t.title}</p>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2 font-chinese">{t.description}</p>
                </div>
                <div className="flex w-full items-center justify-between pt-1">
                  <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', colors.badge)}>
                    {t.subtopics.length} 个角度
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-slate-900 group-hover:text-white">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-300 mt-10 font-chinese">
          AI 助手仅供练习参考，不代表 SEAB 考试标准
        </p>
      </main>

      {/* ── Start modal ── */}
      {showModal && topic && c && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={cn('relative px-6 pt-7 pb-6 bg-gradient-to-br', c.soft)}>
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-slate-500 hover:bg-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-4xl shadow-lg mb-3', c.gradient, c.glow)}>
                {topic.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-800 font-chinese">{topic.title}</h3>
              <p className="text-sm text-slate-500 mt-1 font-chinese leading-relaxed">{topic.description}</p>
            </div>

            {/* Modal body */}
            <div className="px-6 py-6 space-y-5 max-h-[55vh] overflow-y-auto scrollbar-soft">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-chinese">你的名字 <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  autoFocus
                  placeholder="例：陈小明"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                  className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-base outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-chinese"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-chinese">
                  班级 <span className="text-slate-400 font-normal">（选填）</span>
                </label>
                <input
                  type="text"
                  placeholder="例：2A"
                  value={cls}
                  onChange={e => setCls(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                  className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-base outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 font-chinese">
                  练习角度 <span className="text-slate-400 font-normal">（选填，不选则自由讨论）</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {topic.subtopics.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubtopic(v => v === s ? '' : s)}
                      className={cn(
                        'rounded-full px-3.5 py-2 text-xs font-semibold font-chinese transition-all border-2',
                        subtopic === s
                          ? cn('bg-gradient-to-br text-white border-transparent shadow-md', c.gradient)
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 bg-white'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 pb-6 pt-1">
              <button
                disabled={!name.trim()}
                onClick={handleStart}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold text-white font-chinese transition-all',
                  name.trim()
                    ? cn('bg-gradient-to-br shadow-lg hover:opacity-90 hover:scale-[1.01] active:scale-100', c.gradient)
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                开始练习 <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
