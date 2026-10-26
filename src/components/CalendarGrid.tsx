'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DayCardData } from '@/lib/types';
import { readDone } from '@/lib/guest';

const WD5 = ['пн', 'вт', 'ср', 'чт', 'пт'];
const WD7 = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const fmtDate = (ymd: string, o: Intl.DateTimeFormatOptions) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString('ru-RU', { timeZone: 'UTC', ...o });

// Pastel wrapping paper / photo-slot backgrounds, cycled by door.
const TONES = [
  { bg: '#ffe3ea', stripe: '#ffd0dc', ribbon: '#cf3f65' },
  { bg: '#d8ecff', stripe: '#c4e0fa', ribbon: '#e0707f' },
  { bg: '#cfeee0', stripe: '#bde5d2', ribbon: '#cf3f65' },
  { bg: '#ffe7a8', stripe: '#ffdc86', ribbon: '#d2556f' },
  { bg: '#e6dcff', stripe: '#d8caff', ribbon: '#cf3f65' },
];

function Bow({ color }: { color: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 28" className="w-1/2 drop-shadow-sm">
      <path d="M20 14C14 4 3 2 3 9s9 8 17 5Z" fill={color} />
      <path d="M20 14c6-10 17-12 17-5s-9 8-17 5Z" fill={color} />
      <circle cx="20" cy="14" r="4" fill="#fff" fillOpacity=".55" />
    </svg>
  );
}

/** Closed gift: stripes + ribbon + bow. Carries no content, so nothing can leak. */
function Wrapped({ i }: { i: number }) {
  const t = TONES[i % TONES.length];
  return (
    <span
      className="absolute inset-0 grid place-items-center"
      style={{ background: `repeating-linear-gradient(45deg, ${t.bg} 0 10px, ${t.stripe} 10px 20px)` }}
    >
      <span className="absolute inset-y-0 left-1/2 w-[18%] -translate-x-1/2" style={{ background: t.ribbon, opacity: 0.85 }} />
      <span className="absolute inset-x-0 top-1/2 h-[18%] -translate-y-1/2" style={{ background: t.ribbon, opacity: 0.85 }} />
      <span className="relative grid place-items-center"><Bow color={t.ribbon} /></span>
    </span>
  );
}

/** Empty picture slot, shown until the admin adds a cover image. */
function Slot({ i }: { i: number }) {
  const t = TONES[i % TONES.length];
  return (
    <span className="absolute inset-0 grid place-items-center" style={{ background: t.bg }}>
      <span className="absolute inset-[10%] rounded-2xl border-2 border-dashed" style={{ borderColor: t.ribbon, opacity: 0.35 }} />
      <svg aria-hidden viewBox="0 0 24 24" className="twinkle w-1/3" fill="none" stroke={t.ribbon} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
        <rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="10.5" r="1.6" /><path d="m4 17 5-4 4 3 3-2 4 3" />
      </svg>
    </span>
  );
}

const HINTS = [
  'Не так быстро! Эта дверца ещё закрыта.',
  'Подглядывать нехорошо. Но мы вас понимаем.',
  'Терпение: главный ингредиент праздника.',
  'Дверца заперта. Ключ у календаря.',
];

function DayCard({ d, state, i, onLocked }: { d: DayCardData; state: DayCardData['state']; i: number; onLocked: () => void }) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const [shake, setShake] = useState(false);
  const locked = state === 'locked';
  const when = fmtDate(d.ymd, { weekday: 'long', day: 'numeric', month: 'long' });
  const label = `${when}, ${locked ? `закрыто, откроется ${d.opensLabel}` : state === 'completed' ? `${d.title}, выполнено` : d.title}`;

  function open() {
    if (locked) {
      onLocked();
      setShake(true);
      setTimeout(() => setShake(false), 350);
      return;
    }
    setOpening(true);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => router.push(`/day/${d.day}`), reduce ? 0 : 380);
  }

  return (
    <li className={opening ? 'opening' : ''}>
      <button onClick={open} aria-label={label} aria-disabled={locked} className={`group block w-full text-left ${shake ? 'shake' : ''}`}>
        <span className={`card-inner block rounded-[22px] p-1.5 shadow-[0_8px_18px_-6px_rgba(207,63,101,0.45)] group-hover:-translate-y-0.5 ${locked ? 'bg-white/70' : 'bg-white'} ${state === 'completed' ? 'ring-2 ring-rose/60' : ''}`}>
          <span className="relative block aspect-square overflow-hidden rounded-[17px]">
            <span className="pic absolute inset-0 block">
              {locked ? <Wrapped i={i} /> : d.cover ? (
                <img src={d.cover} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : <Slot i={i} />}
            </span>
            {/* date sticker */}
            <span className="absolute left-[3px] top-[3px] grid h-6 w-6 place-items-center rounded-full bg-white text-rose shadow sm:left-1 sm:top-1 sm:h-10 sm:w-10">
              <span className="text-center font-display text-[11px] font-bold leading-none sm:text-lg">
                {Number(d.ymd.slice(8))}
                <span className="hidden font-sans text-[10px] font-semibold leading-none text-muted sm:block">{fmtDate(d.ymd, { month: 'short' })}</span>
              </span>
            </span>
            {state === 'completed' && (
              <span className="pop absolute bottom-[3px] right-[3px] grid h-5 w-5 place-items-center rounded-full bg-rose sm:bottom-1 sm:right-1 sm:h-7 sm:w-7 text-white text-white shadow sm:h-7 sm:w-7" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4 10-10" /></svg>
              </span>
            )}
            {locked && (
              <span className="absolute bottom-[3px] right-[3px] grid h-5 w-5 place-items-center rounded-full bg-white/90 sm:bottom-1 sm:right-1 sm:h-7 sm:w-7 text-muted shadow sm:h-7 sm:w-7" aria-hidden>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 1 1 8 0v3" /></svg>
              </span>
            )}
          </span>
          <span className="block min-h-[2.4em] px-0.5 pb-0.5 pt-1.5 text-[10px] font-semibold leading-tight text-ink [hyphens:auto] sm:px-1 sm:text-sm">
            {locked ? <span className="text-muted"><span className="sm:hidden">Тсс…</span><span className="hidden sm:inline">Тсс… откроется {d.opensLabel}</span></span> : <span className="line-clamp-2">{d.title}</span>}
          </span>
        </span>
      </button>
    </li>
  );
}

export default function CalendarGrid({ days, skipWeekends }: { days: DayCardData[]; skipWeekends: boolean }) {
  const [doneMap, setDoneMap] = useState<Record<string, true>>({});
  const [hint, setHint] = useState('');
  function lockedHint() {
    setHint(HINTS[Math.floor(Math.random() * HINTS.length)]);
    setTimeout(() => setHint(''), 2400);
  }
  useEffect(() => {
    setDoneMap(readDone());
  }, []);

  const items = days.map((d) => ({
    d,
    state: (d.state === 'locked' ? 'locked' : doneMap[String(d.day)] ? 'completed' : 'unlocked') as DayCardData['state'],
  }));
  const cols = skipWeekends ? 5 : 7;
  const first = days.length ? new Date(`${days[0].ymd}T00:00:00Z`).getUTCDay() : 1; // 0 = Sunday
  const offset = skipWeekends ? Math.max(0, first - 1) : (first + 6) % 7; // empty cells before the first door
  const gridCols = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };

  return (
    <section aria-label="Адвент-календарь">
      <ol aria-hidden className="mb-1.5 grid gap-2 text-center text-xs font-bold uppercase tracking-wide text-muted sm:gap-3" style={gridCols}>
        {(skipWeekends ? WD5 : WD7).map((w) => <li key={w}>{w}</li>)}
      </ol>
      <ul className="grid gap-2 sm:gap-3" style={gridCols}>
        {Array.from({ length: offset }, (_, i) => <li key={`gap${i}`} aria-hidden />)}
        {items.map(({ d, state }, i) => (
          <DayCard key={d.day} d={d} state={state} i={i} onLocked={lockedHint} />
        ))}
      </ul>
      <p role="status" aria-live="polite" className={hint ? 'fixed bottom-4 left-1/2 z-10 max-w-[90%] -translate-x-1/2 rounded-full bg-rose px-5 py-2.5 text-center text-sm font-bold text-white shadow-lg' : 'sr-only'}>{hint}</p>
    </section>
  );
}
