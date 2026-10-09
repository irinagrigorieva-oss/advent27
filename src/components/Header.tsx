import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { effectiveTz, getSettings } from '@/lib/calendar';
import TzToggle from './TzToggle';

export default async function Header() {
  const admin = isAdmin();
  const settings = await getSettings();
  const tz = effectiveTz(settings);
  const link = 'rounded px-2 py-2 text-sm text-ink hover:text-rose';

  return (
    <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
      <Link href="/" className="font-display text-xl font-bold text-rose no-underline">♥ Адвент</Link>
      {admin && (
        <nav aria-label="Меню администратора" className="flex items-center gap-1">
          <Link href="/" className={link}>Календарь</Link>
          <Link href="/admin" className={link}>Админка</Link>
        </nav>
      )}
      <div className="w-full text-xs text-muted">
        Дверцы открываются ровно в полночь ({tz}), ни минутой раньше.{' '}
        {settings.tz_mode === 'user' && <TzToggle calendarTz={settings.timezone} active={tz !== settings.timezone} />}
      </div>
    </header>
  );
}
