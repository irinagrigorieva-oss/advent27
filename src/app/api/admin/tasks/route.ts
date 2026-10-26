import { getAdmin } from '@/lib/auth';
import { json, readJson } from '@/lib/api';
import { taskInput } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  if (!(await getAdmin())) return json({ error: 'Доступ запрещён' }, 403);
  const parsed = taskInput.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? 'Некорректные данные' }, 400);
  const { data, error } = await supabaseAdmin().from('tasks').insert(parsed.data).select().single();
  if (error) return json({ error: error.code === '23505' ? 'Для этого дня уже есть задание' : `Не удалось создать: ${error.message}` }, error.code === '23505' ? 409 : 500);
  return json(data, 201);
}
