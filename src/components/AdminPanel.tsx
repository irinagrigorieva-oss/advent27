'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Settings, Task } from '@/lib/types';
import { dayYmd } from '@/lib/time';
import { supabaseBrowser } from '@/lib/supabase/client';

type StatRow = { task_id: string; day: number; title: string; opens: number };

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toIso = (v: string) => (v ? new Date(v).toISOString() : null);

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

function statusOf(t: Task) {
  if (!t.is_published) return 'Черновик';
  if (t.publish_at && Date.parse(t.publish_at) > Date.now()) return 'Запланировано';
  return 'Опубликовано';
}

function TaskForm({ task, nextDay, onDone }: { task: Task | null; nextDay: number; onDone: () => void }) {
  const [f, setF] = useState({
    day: String(task?.day ?? nextDay), title: task?.title ?? '', description: task?.description ?? '',
    instructions: task?.instructions ?? '', media_url: task?.media_url ?? '', cover_url: task?.cover_url ?? '', media_type: task?.media_type ?? '',
    link_url: task?.link_url ?? '', deadline: toLocalInput(task?.deadline ?? null), publish_at: toLocalInput(task?.publish_at ?? null),
    is_published: task?.is_published ?? false, unlock_override: task?.unlock_override ?? '',
  });
  const [err, setErr] = useState('');
  const [upBusy, setUpBusy] = useState(false);
  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr('');
    setUpBusy(true);
    try {
      const t = await call('/api/admin/upload', 'POST', { name: file.name, type: file.type, size: file.size });
      const { error } = await supabaseBrowser().storage.from(t.bucket).uploadToSignedUrl(t.path, t.token, file, { contentType: file.type });
      if (error) throw new Error(error.message);
      setF((p) => ({ ...p, cover_url: t.url }));
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Не удалось загрузить');
    }
    setUpBusy(false);
  }
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const payload = {
      day: Number(f.day), title: f.title, description: f.description, instructions: f.instructions,
      media_url: f.media_url || null, cover_url: f.cover_url || null, media_type: f.media_url ? f.media_type || 'image' : null,
      link_url: f.link_url || null, deadline: toIso(f.deadline), publish_at: toIso(f.publish_at),
      is_published: f.is_published, unlock_override: f.unlock_override || null,
    };
    try {
      await (task ? call(`/api/admin/tasks/${task.id}`, 'PATCH', payload) : call('/api/admin/tasks', 'POST', payload));
      onDone();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Ошибка');
    }
  }

  const L = ({ id, children }: { id: string; children: React.ReactNode }) => <label htmlFor={id} className="mb-1 block text-sm">{children}</label>;
  return (
    <form onSubmit={submit} className="panel grid gap-3 sm:grid-cols-2">
      <div><L id="t-day">Номер дверцы</L><input id="t-day" type="number" min={1} max={31} required className="input" value={f.day} onChange={(e) => set('day', e.target.value)} /></div>
      <div><L id="t-title">Название</L><input id="t-title" required maxLength={120} className="input" value={f.title} onChange={(e) => set('title', e.target.value)} /></div>
      <div className="sm:col-span-2"><L id="t-desc">Описание</L><textarea id="t-desc" rows={3} className="input" value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
      <div className="sm:col-span-2"><L id="t-ins">Инструкция</L><textarea id="t-ins" rows={3} className="input" value={f.instructions} onChange={(e) => set('instructions', e.target.value)} /></div>
      <div className="sm:col-span-2">
        <L id="t-cover">Картинка для карточки в календаре</L>
        <div className="flex flex-wrap items-center gap-3">
          {f.cover_url ? <img src={f.cover_url} alt="Выбранная картинка" className="h-16 w-16 rounded-2xl object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-dashed border-rose/40 text-xs text-muted">нет</span>}
          <input id="t-cover" type="url" placeholder="https://…" className="input !w-auto min-w-0 flex-1" value={f.cover_url} onChange={(e) => set('cover_url', e.target.value)} />
          <label className="btn-ghost cursor-pointer !min-h-[40px]">
            {upBusy ? 'Загружаем…' : 'Загрузить файл'}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={uploadCover} disabled={upBusy} />
          </label>
          {f.cover_url && <button type="button" className="text-sm text-rose underline" onClick={() => set('cover_url', '')}>Убрать</button>}
        </div>
        <p className="mt-1 text-xs text-muted">Квадратная картинка (до 5 МБ). Появляется на карточке, когда день открыт.</p>
      </div>
      <div><L id="t-media">Ссылка на медиа (изображение или видео, https)</L><input id="t-media" type="url" className="input" value={f.media_url} onChange={(e) => set('media_url', e.target.value)} /></div>
      <div><L id="t-mt">Тип медиа</L>
        <select id="t-mt" className="input" value={f.media_type} onChange={(e) => set('media_type', e.target.value)}>
          <option value="image">Изображение</option><option value="video">Видео</option>
        </select></div>
      <div><L id="t-link">Внешняя ссылка</L><input id="t-link" type="url" className="input" value={f.link_url} onChange={(e) => set('link_url', e.target.value)} /></div>
      <div><L id="t-dl">Срок выполнения (ваше местное время)</L><input id="t-dl" type="datetime-local" className="input" value={f.deadline} onChange={(e) => set('deadline', e.target.value)} /></div>
      <div><L id="t-pa">Опубликовать в (расписание)</L><input id="t-pa" type="datetime-local" className="input" value={f.publish_at} onChange={(e) => set('publish_at', e.target.value)} /></div>
      <div><L id="t-ov">Принудительный режим</L>
        <select id="t-ov" className="input" value={f.unlock_override} onChange={(e) => set('unlock_override', e.target.value)}>
          <option value="">Автоматически (по дате)</option><option value="force_unlock">Всегда открыт</option><option value="force_lock">Всегда закрыт</option>
        </select></div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" className="h-4 w-4 accent-[#cf3f65]" checked={f.is_published} onChange={(e) => set('is_published', e.target.checked)} />
        Опубликовано (если дата публикации в будущем, задание считается запланированным)
      </label>
      {err && <p role="alert" className="text-sm text-berry sm:col-span-2">{err}</p>}
      <div className="flex gap-3 sm:col-span-2">
        <button className="btn-primary">{task ? 'Сохранить' : 'Создать задание'}</button>
        <button type="button" className="btn-ghost" onClick={onDone}>Отмена</button>
      </div>
    </form>
  );
}

export default function AdminPanel({ tasks, stats, settings }: { tasks: Task[]; stats: StatRow[]; settings: Settings }) {
  const router = useRouter();
  const [tab, setTab] = useState<'tasks' | 'analytics' | 'settings'>('tasks');
  const [editing, setEditing] = useState<Task | 'new' | null>(null);
  const [err, setErr] = useState('');
  const [s, setS] = useState({ ...settings, total_days: String(settings.total_days) });
  const [sMsg, setSMsg] = useState('');

  const refresh = () => router.refresh();
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
  }
  async function act(fn: () => Promise<unknown>) {
    setErr('');
    try { await fn(); refresh(); } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
  }
  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      await call('/api/admin/settings', 'PATCH', { ...s, total_days: Number(s.total_days) });
      setSMsg('Сохранено.'); refresh();
    } catch (e2) { setSMsg(e2 instanceof Error ? e2.message : 'Ошибка'); }
  }

  const tabs = ['tasks', 'analytics', 'settings'] as const;
  const maxOpens = Math.max(1, ...stats.map((x) => x.opens));
  const totalOpens = stats.reduce((a, x) => a + x.opens, 0);

  return (
    <div>
      <div role="tablist" aria-label="Разделы админки" className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`${tab === t ? 'btn-primary' : 'btn-ghost'} `}>{({ tasks: 'Задания', analytics: 'Аналитика', settings: 'Настройки' } as const)[t]}</button>
        ))}
        <button className="btn-ghost ml-auto" onClick={logout}>Выйти</button>
      </div>
      {err && <p role="alert" className="mb-3 text-berry">{err}</p>}

      {tab === 'tasks' && (
        <section>
          {editing ? (
            <TaskForm task={editing === 'new' ? null : editing} nextDay={Math.min(31, Math.max(0, ...tasks.map((t) => t.day)) + 1)} onDone={() => { setEditing(null); refresh(); }} />
          ) : (
            <>
              <button className="btn-primary mb-3" onClick={() => setEditing('new')}>+ Новое задание</button>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <caption className="sr-only">Задания</caption>
                  <thead className="text-muted"><tr><th className="p-2">Дверца · дата</th><th>Название</th><th>Статус</th><th>Режим</th><th className="text-right">Действия</th></tr></thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t.id} className="border-t border-rose/10">
                        <td className="p-2 whitespace-nowrap"><span className="font-display text-rose">{t.day}</span> <span className="text-muted">· {new Date(`${dayYmd(settings.start_date, t.day, settings.skip_weekends)}T00:00:00Z`).toLocaleDateString('ru-RU', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })}</span></td>
                        <td>{t.title}</td>
                        <td>{statusOf(t)}</td>
                        <td>
                          <label className="sr-only" htmlFor={`ov-${t.id}`}>Режим для дня {t.day}</label>
                          <select id={`ov-${t.id}`} className="input !w-auto !py-1" value={t.unlock_override ?? ''}
                            onChange={(e) => act(() => call(`/api/admin/tasks/${t.id}`, 'PATCH', { unlock_override: e.target.value || null }))}>
                            <option value="">Авто</option><option value="force_unlock">Открыт</option><option value="force_lock">Закрыт</option>
                          </select>
                        </td>
                        <td className="space-x-2 whitespace-nowrap text-right">
                          <button className="btn-ghost !min-h-[36px] !px-3" onClick={() => act(() => call(`/api/admin/tasks/${t.id}`, 'PATCH', { is_published: !t.is_published }))}>{t.is_published ? 'Скрыть' : 'Опубликовать'}</button>
                          <button className="btn-ghost !min-h-[36px] !px-3" onClick={() => setEditing(t)}>Изменить</button>
                          <button className="btn-ghost !min-h-[36px] !px-3 text-berry" onClick={() => confirm(`Удалить день ${t.day}?`) && act(() => call(`/api/admin/tasks/${t.id}`, 'DELETE'))}>Удалить</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'analytics' && (
        <section>
          <dl className="mb-4 grid grid-cols-3 gap-3 text-center">
            <div className="panel col-span-3"><dt className="text-xs text-muted">Всего открытий дверец</dt><dd className="font-display text-3xl text-rose">{totalOpens}</dd></div>
          </dl>
          <ul className="space-y-2">
            {stats.map((x) => (
              <li key={x.task_id} className="text-sm">
                <div className="flex justify-between"><span>День {x.day} · {x.title}</span><span className="text-muted">{x.opens} откр.</span></div>
                <div className="mt-1 h-2 rounded-full bg-rose/10" aria-hidden><div className="h-full rounded-full bg-rose" style={{ width: `${(x.opens / maxOpens) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'settings' && (
        <form onSubmit={saveSettings} className="panel grid max-w-lg gap-3">
          <div><label htmlFor="s-start" className="mb-1 block text-sm">Дата первого дня</label><input id="s-start" type="date" required className="input" value={s.start_date} onChange={(e) => setS({ ...s, start_date: e.target.value })} /></div>
          <div><label htmlFor="s-tz" className="mb-1 block text-sm">Часовой пояс календаря (IANA, например Europe/Moscow)</label><input id="s-tz" required className="input" value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })} /></div>
          <div><label htmlFor="s-n" className="mb-1 block text-sm">Количество дней</label><input id="s-n" type="number" min={1} max={31} required className="input" value={s.total_days} onChange={(e) => setS({ ...s, total_days: e.target.value })} /></div>
          <div><label htmlFor="s-m" className="mb-1 block text-sm">Когда открывать дни</label>
            <select id="s-m" className="input" value={s.tz_mode} onChange={(e) => setS({ ...s, tz_mode: e.target.value as Settings['tz_mode'] })}>
              <option value="calendar">По часовому поясу календаря для всех (честно, рекомендуется)</option>
              <option value="user">По часовому поясу посетителя (по желанию)</option>
            </select></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[#cf3f65]" checked={s.skip_weekends} onChange={(e) => setS({ ...s, skip_weekends: e.target.checked })} />
            Без дверец в субботу и воскресенье (день 1 — первый будний день с даты старта)
          </label>
          <button className="btn-primary">Сохранить настройки</button>
          <p role="status" className="text-sm text-muted">{sMsg}</p>
        </form>
      )}
    </div>
  );
}
