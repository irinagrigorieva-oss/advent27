import AdminPanel from '@/components/AdminPanel';
import AdminLogin from '@/components/AdminLogin';
import { isAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/calendar';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Админка', robots: { index: false } };

export default async function Admin() {
  if (!isAdmin()) {
    return <AdminLogin configured={!!process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 6} />;
  }
  const db = supabaseAdmin();
  const [tasks, stats, settings] = await Promise.all([
    db.from('tasks').select('*').order('day'),
    db.from('task_stats').select('*').order('day'),
    getSettings(),
  ]);
  return (
    <main>
      <h1 className="font-display text-3xl font-bold">Админка</h1>
      <p className="mb-4 mt-1 text-muted">Здесь вы Дед Мороз: решаете, что открыть, что спрятать и кому ещё рано.</p>
      <AdminPanel tasks={tasks.data ?? []} stats={stats.data ?? []} settings={settings} />
    </main>
  );
}
