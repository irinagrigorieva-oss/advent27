-- Схема адвент-календаря. Запустите в SQL-редакторе Supabase (или `supabase db push`).
create extension if not exists pgcrypto;

-- ───────────── settings (single row) ─────────────
create table public.settings (
  id int primary key default 1 check (id = 1),
  start_date date not null default '2026-12-01',
  timezone text not null default 'Europe/Moscow',          -- IANA tz the calendar unlocks in
  total_days int not null default 24 check (total_days between 1 and 31),
  tz_mode text not null default 'calendar' check (tz_mode in ('calendar','user')),
  skip_weekends boolean not null default true     -- no doors on Saturdays and Sundays
);
insert into public.settings default values;

-- ───────────── users ─────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Участник',
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'Участник'))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ───────────── tasks ─────────────
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  day int not null unique check (day between 1 and 31),
  title text not null check (char_length(title) <= 120),
  description text not null default '',
  instructions text not null default '',
  media_url text,
  media_type text check (media_type in ('image','video')),
  cover_url text,                         -- picture slot on the calendar card
  link_url text,
  deadline timestamptz,
  publish_at timestamptz,                 -- scheduled publishing
  is_published boolean not null default false,
  unlock_override text check (unlock_override in ('force_unlock','force_lock')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────── progress ─────────────
create table public.user_task_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  notes text not null default '' check (char_length(notes) <= 10000),
  files jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, task_id)
);

-- ───────────── publications / likes / comments ─────────────
create table public.publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  slug text not null unique,
  content text not null default '' check (char_length(content) <= 2000),
  media_url text,
  is_public boolean not null default false,   -- true = listed in feed; false = link-only
  created_at timestamptz not null default now(),
  unique (user_id, task_id)
);
create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  publication_id uuid not null references public.publications(id) on delete cascade,
  primary key (user_id, publication_id)
);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

-- ───────────── analytics ─────────────
create table public.events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  type text not null check (type in ('open','complete','share')),
  created_at timestamptz not null default now()
);
create index on public.events (task_id, type);
create index on public.user_task_progress (user_id);
create index on public.publications (is_public, created_at desc);

create view public.task_stats as
  select t.id as task_id, t.day, t.title,
    count(*) filter (where e.type = 'open')     as opens,
    count(*) filter (where e.type = 'complete') as completions,
    count(*) filter (where e.type = 'share')    as shares
  from public.tasks t left join public.events e on e.task_id = t.id
  group by t.id;

create view public.user_summary as
  select p.id, p.email, p.display_name, p.role, p.created_at,
    count(u.id) as started,
    count(u.id) filter (where u.status = 'completed') as completed
  from public.profiles p left join public.user_task_progress u on u.user_id = p.id
  group by p.id;

revoke all on public.task_stats, public.user_summary from anon, authenticated;

-- ───────────── Row Level Security ─────────────
alter table public.settings enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.user_task_progress enable row level security;
alter table public.publications enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.events enable row level security;

-- Task content is NEVER readable with the anon key: the server (service role)
-- applies the unlock check, so locked content cannot leak via the API.
create policy "admin all tasks" on public.tasks for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());

create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;   -- users can't self-promote

create policy "own progress" on public.user_task_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own publications" on public.publications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "public publications readable" on public.publications for select using (is_public);

create policy "own likes" on public.likes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own comments delete" on public.comments for delete using (user_id = auth.uid());
-- events: no policies → service role only.

-- ───────────── Storage ─────────────
-- No storage.objects policies: uploads use server-issued signed URLs, private
-- files are read through short-lived signed URLs; public bucket is read-only public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('user-files', 'user-files', false, 10485760,
    array['image/png','image/jpeg','image/webp','image/gif','application/pdf','text/plain']),
  ('publication-media', 'publication-media', true, 5242880,
    array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;

-- ───────────── Seed: 24 sample tasks ─────────────
insert into public.tasks (day, title, description, instructions, is_published)
select d, t.title,
  'Небольшое праздничное задание на день ' || d || '. Уделите ему несколько минут, получите удовольствие и запишите, как всё прошло.',
  E'1. Прочитайте описание.\n2. Выполните задание.\n3. Добавьте заметку или фото и отметьте задание выполненным.',
  true
from unnest(array[
  'Напишите благодарственную записку','Испеките что-нибудь сладкое','Повесьте гирлянду','Позвоните старому другу',
  'Выйдите на зимнюю прогулку','Выучите рождественскую песню','Упакуйте один подарок','Разберите одну полку',
  'Сварите горячий шоколад','Отправьте открытку','Вырежьте бумажную снежинку','Приготовьте новое блюдо',
  'Отдайте что-нибудь ненужное','Прочитайте зимнюю историю','Сфотографируйте что-то уютное','Сделайте комплимент незнакомцу',
  'Составьте плейлист','Нарисуйте зимний пейзаж','Наведите порядок на рабочем столе','Попробуйте новый чай',
  'Спланируйте встречу','Напишите список благодарностей','Поставьте цель на следующий год','Поделитесь любимым днём'
]) with ordinality as t(title, d)
on conflict (day) do nothing;
