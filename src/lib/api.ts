import 'server-only';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase/admin';

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function track(type: 'open', taskId: string) {
  try {
    await supabaseAdmin().from('events').insert({ type, task_id: taskId });
  } catch {
    /* analytics must never break a page */
  }
}

export const publicMediaUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/publication-media/${path}`;
