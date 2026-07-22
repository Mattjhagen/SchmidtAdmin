'use server';

// Site Editor writes (portfolio, site config, service overrides).
// The public site only has read access via RLS, and the browser client's
// authenticated role lacks write policies on some of these tables — so all
// writes go through these admin-verified server actions using the service
// role key (same pattern as uploadImage / admin actions).

import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { isAdmin } from '@/lib/auth';

type Result<T = undefined> = { success: true; data?: T } | { success: false; error: string };

async function getServiceClient() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    throw new Error('Unauthorized: Admin access required.');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase service role key is not configured.');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------- Portfolio ----------

export async function createPortfolioItemAction(item: Record<string, unknown>): Promise<Result<any>> {
  try {
    const db = await getServiceClient();
    const { data, error } = await db.from('portfolio_items').insert([item]).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createPortfolioItemsAction(items: Record<string, unknown>[]): Promise<Result<any[]>> {
  try {
    const db = await getServiceClient();
    const { data, error } = await db.from('portfolio_items').insert(items).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data: data ?? [] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updatePortfolioItemAction(id: string, updates: Record<string, unknown>): Promise<Result<any>> {
  try {
    const db = await getServiceClient();
    const { data, error } = await db.from('portfolio_items').update(updates).eq('id', id).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deletePortfolioItemAction(id: string): Promise<Result> {
  try {
    const db = await getServiceClient();
    const { error } = await db.from('portfolio_items').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ---------- Site config ----------

export async function updateSiteConfigBatchAction(updates: Record<string, string>): Promise<Result> {
  try {
    const db = await getServiceClient();
    const rows = Object.entries(updates).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }));
    const { error } = await db.from('site_config').upsert(rows, { onConflict: 'key' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ---------- Service overrides ----------

export async function upsertServiceOverrideAction(
  slug: string,
  updates: { long_description?: string; image_url?: string },
): Promise<Result> {
  try {
    const db = await getServiceClient();
    const { error } = await db
      .from('service_overrides')
      .upsert({ slug, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'slug' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
