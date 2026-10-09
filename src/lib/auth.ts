import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * No user accounts. The admin signs in with one password (env ADMIN_PASSWORD);
 * the cookie holds an HMAC derived from it, so changing the password signs everyone out.
 */
const COOKIE = 'advent_admin';

function token(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 6) return null;
  return createHmac('sha256', pw).update('advent-admin-v1').digest('hex');
}

export function passwordOk(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 6) return false;
  const a = createHmac('sha256', 'cmp').update(input).digest();
  const b = createHmac('sha256', 'cmp').update(pw).digest();
  return timingSafeEqual(a, b);
}

export const adminCookie = { name: COOKIE, value: () => token() };

export function isAdmin(): boolean {
  const t = token();
  const c = cookies().get(COOKIE)?.value;
  if (!t || !c || c.length !== t.length) return false;
  return timingSafeEqual(Buffer.from(c), Buffer.from(t));
}

/** Kept async so existing call sites (`await getAdmin()`) stay unchanged. */
export async function getAdmin(): Promise<boolean> {
  return isAdmin();
}
