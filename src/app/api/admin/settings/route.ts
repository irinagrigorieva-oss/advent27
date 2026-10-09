import { getAdmin } from '@/lib/auth';
import { json, readJson } from '@/lib/api';
import { settingsInput } from '@/lib/validation';
import { isValidTz } from '@/lib/time';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PATCH(req: Request) {
  if (!(await getAdmin())) return json({ error: 'Доступ запрещён' }, 403);
  const parsed = settingsInput.safeParse(await readJson(req));
  if (!parsed.success || !isValidTz(parsed.data.timezone)) return json({ error: 'Некорректные настройки' }, 400);
  const { error } = await supabaseAdmin().from('settings').upsert({ id: 1, ...parsed.data });
  return error ? json({ error: 'Не удалось сохранить' }, 500) : json({ ok: true });
}
