import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

/**
 * Supabase client with service role key.
 * Use this in the backend only; it bypasses RLS. Never expose this key to the frontend.
 * Null if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing in .env.
 */
export const supabase =
  env.supabase.url && env.supabase.serviceRoleKey
    ? createClient(env.supabase.url, env.supabase.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export function getSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
    );
  }
  return supabase;
}
console.log('[SUPABASE URL]', env.supabase.url);
