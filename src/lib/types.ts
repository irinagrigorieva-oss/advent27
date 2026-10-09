export type Settings = {
  start_date: string; // YYYY-MM-DD, local date of day 1 in the calendar timezone
  timezone: string;
  total_days: number;
  tz_mode: 'calendar' | 'user';
  skip_weekends: boolean; // no doors on Saturdays and Sundays
};
export type Override = 'force_unlock' | 'force_lock' | null;

export type Task = {
  id: string;
  day: number;
  title: string;
  description: string;
  instructions: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  cover_url: string | null; // picture shown on the calendar card once the day is open
  link_url: string | null;
  deadline: string | null;
  publish_at: string | null;
  is_published: boolean;
  unlock_override: Override;
  created_at: string;
  updated_at: string;
};

export type DayCardData = {
  day: number; // door index (1..N), used in URLs
  ymd: string; // calendar date of the door, e.g. 2026-12-07 (its number is shown on the card)
  title: string | null; // null while locked (no spoilers)
  cover: string | null; // null while locked, or when no picture is set
  state: 'locked' | 'unlocked' | 'completed';
  opensLabel: string | null;
};
