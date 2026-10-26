import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getAdmin } from '@/lib/auth';
import { json, publicMediaUrl, readJson } from '@/lib/api';
import { ALLOWED } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';

const body = z.object({ name: z.string().min(1).max(200), type: z.string().max(100), size: z.number().int().min(1) });

/** Admin-only signed upload for card pictures. Stored publicly under covers/. */
export async function POST(req: Request) {
  if (!(await getAdmin())) return json({ error: 'Доступ запрещён' }, 403);
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: 'Некорректные данные' }, 400);
  const rule = ALLOWED.public;
  const { name, type, size } = parsed.data;
  if (!(rule.types as readonly string[]).includes(type)) return json({ error: 'Этот тип файла не поддерживается' }, 415);
  if (size > rule.max) return json({ error: `Файл слишком большой (максимум ${rule.max / 1024 / 1024} МБ)` }, 413);

  const path = `covers/${randomUUID()}-${name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60)}`;
  const { data, error } = await supabaseAdmin().storage.from(rule.bucket).createSignedUploadUrl(path);
  if (error || !data) return json({ error: `Не удалось начать загрузку: ${error?.message ?? 'нет ответа'}` }, 500);
  return json({ bucket: rule.bucket, path, token: data.token, url: publicMediaUrl(path) });
}
