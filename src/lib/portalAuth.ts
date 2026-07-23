// Server-side helpers for the customer portal API routes.
// Location: src/lib/portalAuth.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isAdmin } from './auth';
import { SUPABASE_URL, SUPABASE_ANON_KEY, getServiceRoleKey } from './supabaseEnv';

export interface PortalCaller {
  email: string;
  name: string;
  isAdmin: boolean;
}

export function getServiceClient(): SupabaseClient | null {
  const key = getServiceRoleKey();
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

/** Verify the Supabase access token from the Authorization header. */
export async function getCaller(req: Request): Promise<PortalCaller | null> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return null;

  const email = data.user.email;
  return {
    email,
    name: (data.user.user_metadata?.name as string) || email.split('@')[0],
    isAdmin: isAdmin(email),
  };
}
