import { createClient } from '@supabase/supabase-js';

/** Browser client: only used for the admin's signed picture upload. */
export const supabaseBrowser = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
