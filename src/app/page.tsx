import CalendarGrid from '@/components/CalendarGrid';
import { isAdmin } from '@/lib/auth';
import { getCalendar } from '@/lib/calendar';
import { dayUnlockAt, formatInTz } from '@/lib/time';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { days, settings, tz } = await getCalendar(isAdmin());
  const start = dayUnlockAt(settings.start_date, 1, tz, settings.skip_weekends);
  const notStarted = Date.now() < start;

  return (
    <main>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        Адвент-<span className="text-rose">календарь</span> на {days.length} дн.
      </h1>
      <p className="mb-6 mt-2 max-w-xl text-muted">
        {notStarted
          ? `Первая дверца откроется ${formatInTz(start, tz, { dateStyle: 'long' })}. А пока можно красиво предвкушать.`
          : 'Одна дверца в будний день: по выходным даже календарь отдыхает. Открывайте сегодняшнюю, возвращайтесь к прежним и не подглядывайте вперёд.'}
      </p>
      <CalendarGrid days={days} skipWeekends={settings.skip_weekends} />
    </main>
  );
}
