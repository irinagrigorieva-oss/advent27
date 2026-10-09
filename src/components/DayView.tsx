'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isDone, setDone } from '@/lib/guest';

type TaskView = {
  title: string; description: string; instructions: string;
  media_url: string | null; media_type: 'image' | 'video' | null; link_url: string | null;
  deadlineLabel: string | null; overdue: boolean; draft: boolean;
};

export default function DayView({ day, total, dateLabel, prevLabel, nextLabel, task }: {
  day: number; total: number; dateLabel: string; prevLabel: string | null; nextLabel: string | null; task: TaskView;
}) {
  const [done, setDoneState] = useState(false);
  useEffect(() => setDoneState(isDone(day)), [day]);
  function toggle() {
    const next = !done;
    setDoneState(next);
    setDone(day, next);
  }
  const link = 'btn-ghost !min-h-[40px] no-underline';

  return (
    <main className="rise mx-auto max-w-2xl">
      <nav aria-label="Навигация по дням" className="mb-4 flex items-center justify-between text-sm">
        <Link href="/" className="text-rose">← Календарь</Link>
        <span className="flex gap-2">
          {day > 1 && <Link href={`/day/${day - 1}`} className={link} aria-label="Предыдущий день">‹ {prevLabel}</Link>}
          {day < total && <Link href={`/day/${day + 1}`} className={link} aria-label="Следующий день">{nextLabel} ›</Link>}
        </span>
      </nav>

      <article className="panel">
        <p className="font-display text-rose first-letter:uppercase">{dateLabel}{task.draft && <span className="ml-2 rounded bg-berry px-2 py-0.5 text-xs text-white">Черновик</span>}</p>
        <h1 className="mt-1 font-display text-3xl font-bold">{task.title}</h1>
        {task.deadlineLabel && (
          <p className={`mt-2 text-sm ${task.overdue ? 'text-berry' : 'text-muted'}`}>
            {task.overdue ? 'Срок истёк (мы никому не скажем): ' : 'Успеть до: '}{task.deadlineLabel}
          </p>
        )}

        {task.media_url && task.media_type === 'image' && (
          <img src={task.media_url} alt="" loading="lazy" className="mt-4 max-h-96 w-full rounded-xl object-cover" />
        )}
        {task.media_url && task.media_type === 'video' && (
          <video src={task.media_url} controls preload="none" className="mt-4 w-full rounded-xl" />
        )}

        {task.description && <p className="mt-4 whitespace-pre-wrap leading-relaxed">{task.description}</p>}
        {task.instructions && (
          <section className="mt-4 rounded-xl bg-cream/60 p-4" aria-labelledby="instr">
            <h2 id="instr" className="mb-1 text-sm font-semibold uppercase tracking-wide text-rose">Инструкция</h2>
            <p className="whitespace-pre-wrap leading-relaxed">{task.instructions}</p>
          </section>
        )}
        {task.link_url && (
          <a href={task.link_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-4 inline-block text-rose">
            Открыть ссылку ↗
          </a>
        )}
      </article>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button aria-pressed={done} onClick={toggle} className={done ? 'btn-ghost' : 'btn-primary'}>
          {done ? '✓ Сделано (передумали? нажмите)' : 'Готово! Отметить выполненным'}
        </button>
        {done && <span className="pop text-rose">🎉 Какао заслужено!</span>}
      </div>
      <p className="mt-2 text-xs text-muted">Отметка хранится только в вашем браузере.</p>
    </main>
  );
}
