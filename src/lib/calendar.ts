import 'server-only';
import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase/admin';
import { dayUnlockAt, dayYmd, formatInTz, isValidTz } from './time';
import type { DayCardData, Settings, Task } from './types';

const DEFAULTS: Settings = { start_date: '2026-12-01', timezone: 'UTC', total_days: 24, tz_mode: 'calendar', skip_weekends: true };

export async function getSettings(): Promise<Settings> {
  const { data } = await supabaseAdmin().from('settings').select('*').eq('id', 1).maybeSingle();
  return { ...DEFAULTS, ...(data ?? {}) } as Settings;
}

/** Calendar tz, or the visitor's tz when the admin enabled tz_mode = 'user'. */
export function effectiveTz(s: Settings): string {
  if (s.tz_mode === 'user') {
    const c = cookies().get('advent_tz')?.value;
    if (c && isValidTz(c)) return c;
  }
  return s.timezone;
}

export function taskVisible(t: Task, now: number): boolean {
  return t.is_published && (!t.publish_at || Date.parse(t.publish_at) <= now);
}

export function isUnlockedByTime(t: Task | undefined, day: number, s: Settings, tz: string, now: number): boolean {
  if (t?.unlock_override === 'force_lock') return false;
  if (t?.unlock_override === 'force_unlock') return true;
  return now >= dayUnlockAt(s.start_date, day, tz, s.skip_weekends);
}

export type DayContext = {
  settings: Settings;
  tz: string;
  task: Task | null; // null if missing/unpublished (for non-admins)
  unlocked: boolean;
  unlockAt: number;
};

/** Single source of truth for "may this viewer open day N?" — always evaluated server-side. */
export async function getDayContext(day: number, admin: boolean, settings?: Settings): Promise<DayContext> {
  const s = settings ?? (await getSettings());
  const tz = effectiveTz(s);
  const now = Date.now();
  const { data } = await supabaseAdmin().from('tasks').select('*').eq('day', day).maybeSingle();
  const task = (data as Task | null) ?? null;
  const visible = !!task && (admin || taskVisible(task, now));
  const unlocked = visible && day >= 1 && day <= s.total_days && isUnlockedByTime(task ?? undefined, day, s, tz, now);
  return { settings: s, tz, task: visible ? task : null, unlocked, unlockAt: dayUnlockAt(s.start_date, day, tz, s.skip_weekends) };
}

export async function getCalendar(admin: boolean) {
  const settings = await getSettings();
  const tz = effectiveTz(settings);
  const now = Date.now();
  const db = supabaseAdmin();

  const { data: tasks } = await db.from('tasks').select('*');
  const byDay = new Map<number, Task>();
  for (const t of (tasks ?? []) as Task[]) byDay.set(t.day, t);

  const days: DayCardData[] = [];
  for (let d = 1; d <= settings.total_days; d++) {
    const t = byDay.get(d);
    const visible = !!t && (admin || taskVisible(t, now));
    const unlocked = visible && isUnlockedByTime(t, d, settings, tz, now);
    const at = dayUnlockAt(settings.start_date, d, tz, settings.skip_weekends);
    days.push({
      day: d,
      ymd: dayYmd(settings.start_date, d, settings.skip_weekends),
      title: unlocked && t ? t.title : null,
      cover: unlocked && t ? t.cover_url : null,
      state: !unlocked ? 'locked' : 'unlocked',
      opensLabel: unlocked ? null : visible && at > now ? formatInTz(at, tz, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Скоро',
    });
  }
  return { days, settings, tz };
}
