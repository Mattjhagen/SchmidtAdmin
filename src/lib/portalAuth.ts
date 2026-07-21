// Server-side helpers for the customer portal API routes.
// Location: src/lib/portalAuth.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isAdmin } from './auth';

export interface PortalCaller {
  email: string;
  name: string;
  isAdmin: boolean;
}

export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Verify the Supabase access token from the Authorization header. */
export async function getCaller(req: Request): Promise<PortalCaller | null> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return null;

  const email = data.user.email;
  return {
    email,
    name: (data.user.user_metadata?.name as string) || email.split('@')[0],
    isAdmin: isAdmin(email),
  };
}
