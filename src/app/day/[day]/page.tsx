import Link from 'next/link';
import { notFound } from 'next/navigation';
import DayView from '@/components/DayView';
import { isAdmin } from '@/lib/auth';
import { getDayContext, getSettings } from '@/lib/calendar';
import { dayYmd, formatInTz } from '@/lib/time';
import { track } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'День', robots: { index: false } };

const fmtDate = (ymd: string, o: Intl.DateTimeFormatOptions) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString('ru-RU', { timeZone: 'UTC', ...o });

export default async function DayPage({ params }: { params: { day: string } }) {
  const day = Number(params.day);
  const settings = await getSettings();
  if (!Number.isInteger(day) || day < 1 || day > settings.total_days) notFound();

  const ctx = await getDayContext(day, isAdmin(), settings);

  if (!ctx.task || !ctx.unlocked) {
    const when = ctx.task || ctx.unlockAt > Date.now() ? formatInTz(ctx.unlockAt, ctx.tz, { dateStyle: 'full' }) : null;
    return (
      <main className="panel mx-auto mt-8 max-w-md text-center">
        <p className="font-display text-5xl text-rose">{Number(dayYmd(settings.start_date, day, settings.skip_weekends).slice(8))}</p>
        <h1 className="mt-3 text-xl font-semibold">Тсс, ещё рано!</h1>
        <p className="mt-2 text-muted">{when ? `Дверца откроется ${when} (${ctx.tz}). Подарок никуда не денется, обещаем.` : 'Загляните позже: подарок никуда не денется.'}</p>
        <Link href="/" className="btn-primary mt-5 no-underline">Вернуться к календарю</Link>
      </main>
    );
  }

  const { task } = ctx;
  await track('open', task.id);

  const deadline = task.deadline ? Date.parse(task.deadline) : null;
  return (
    <DayView
      day={day}
      total={settings.total_days}
      dateLabel={fmtDate(dayYmd(settings.start_date, day, settings.skip_weekends), { weekday: 'long', day: 'numeric', month: 'long' })}
      prevLabel={day > 1 ? fmtDate(dayYmd(settings.start_date, day - 1, settings.skip_weekends), { weekday: 'short', day: 'numeric', month: 'short' }) : null}
      nextLabel={day < settings.total_days ? fmtDate(dayYmd(settings.start_date, day + 1, settings.skip_weekends), { weekday: 'short', day: 'numeric', month: 'short' }) : null}
      task={{
        title: task.title,
        description: task.description,
        instructions: task.instructions,
        media_url: task.media_url,
        media_type: task.media_type,
        link_url: task.link_url,
        deadlineLabel: deadline ? `${formatInTz(deadline, ctx.tz, { dateStyle: 'medium', timeStyle: 'short' })} (${ctx.tz})` : null,
        overdue: deadline ? deadline < Date.now() : false,
        draft: !task.is_published,
      }}
    />
  );
}
