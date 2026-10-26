import { getAdmin } from '@/lib/auth';
import { json, readJson } from '@/lib/api';
import { taskPatch } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getAdmin())) return json({ error: 'Доступ запрещён' }, 403);
  const parsed = taskPatch.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? 'Некорректные данные' }, 400);
  const { data, error } = await supabaseAdmin()
    .from('tasks')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();
  if (error) return json({ error: error.code === '23505' ? 'Для этого дня уже есть задание' : `Не удалось обновить: ${error.message}` }, error.code === '23505' ? 409 : 500);
  return json(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await getAdmin())) return json({ error: 'Доступ запрещён' }, 403);
  const { error } = await supabaseAdmin().from('tasks').delete().eq('id', params.id);
  return error ? json({ error: 'Не удалось удалить' }, 500) : json({ ok: true });
}
