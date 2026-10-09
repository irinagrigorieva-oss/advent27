'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    setBusy(false);
    if (r.ok) router.refresh();
    else setErr((await r.json().catch(() => ({}))).error || 'Не получилось войти');
  }

  return (
    <main className="panel mx-auto mt-8 max-w-sm">
      <h1 className="font-display text-2xl font-bold">Вход для администратора</h1>
      {!configured ? (
        <p className="mt-3 text-sm text-berry">Пароль ещё не задан. Добавьте переменную ADMIN_PASSWORD (не короче 6 символов) в настройках Vercel и сделайте Redeploy.</p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label htmlFor="pw" className="block text-sm">Пароль</label>
          <input id="pw" type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required />
          <button className="btn-primary" disabled={busy}>{busy ? 'Проверяем…' : 'Войти'}</button>
          {err && <p role="alert" className="text-sm text-berry">{err}</p>}
        </form>
      )}
    </main>
  );
}
