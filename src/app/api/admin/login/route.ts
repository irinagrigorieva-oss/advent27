import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminCookie, passwordOk } from '@/lib/auth';
import { json, readJson } from '@/lib/api';

const body = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  const parsed = body.safeParse(await readJson(req));
  const ok = parsed.success && passwordOk(parsed.data.password);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return json({ error: 'Пароль не подошёл. Попробуйте ещё раз.' }, 401);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookie.name, adminCookie.value()!, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
