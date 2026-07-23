'use server';

import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { isAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { SUPABASE_URL, getServiceRoleKey } from '@/lib/supabaseEnv';

async function verifyAdmin() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    throw new Error('Unauthorized: Admin access required.');
  }
  return supabase;
}

export async function onboardEmployee(payload: { email: string; name: string; tempPassword: string }) {
  try {
    await verifyAdmin();

    const serviceKey = getServiceRoleKey();

    if (!serviceKey) {
      return { success: false, error: 'Supabase Service Role Key is not configured in the environment.' };
    }

    const adminClient = createClient(SUPABASE_URL, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create user in Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: payload.email,
      password: payload.tempPassword,
      email_confirm: true,
      user_metadata: {
        name: payload.name,
        force_password_change: true
      }
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Failed to create user in Auth.' };
    }

    // Initialize default contractor settings for this new employee
    const { error: settingsError } = await adminClient
      .from('contractor_settings')
      .insert({
        user_id: authData.user.id,
        contractor_name: payload.name,
        time_zone: 'America/Chicago',
        hourly_rate_cents: 2500, // default rate ($25.00/hr)
        additional_rate_enabled: false,
        auto_clock_out_enabled: true
      });

    if (settingsError) {
      // Clean up the auth user if settings initialization failed
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: 'Failed to initialize contractor settings: ' + settingsError.message };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

export async function getEmployees() {
  try {
    await verifyAdmin();
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('contractor_settings')
      .select('*')
      .order('contractor_name', { ascending: true });
      
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

export async function getEmployeeTimeEntries(targetUserId: string) {
  try {
    await verifyAdmin();
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        breaks:time_entry_breaks(*)
      `)
      .eq('user_id', targetUserId)
      .order('clock_in', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

export async function adminEditTimeEntry(
  id: string,
  payload: { clock_in?: string; clock_out?: string | null; project?: string; notes?: string; status?: string; needs_review?: boolean },
  reason: string
) {
  try {
    const supabase = await verifyAdmin();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    if (!reason || reason.trim() === '') return { success: false, error: 'A reason is required to edit a time entry.' };

    const { data: existing } = await supabase
      .from('time_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) return { success: false, error: 'Time entry not found.' };

    const updates: any = { updated_at: new Date().toISOString() };
    if (payload.clock_in) updates.clock_in = payload.clock_in;
    if (payload.clock_out !== undefined) updates.clock_out = payload.clock_out;
    if (payload.project !== undefined) updates.project = payload.project;
    if (payload.notes !== undefined) updates.notes = payload.notes;
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.needs_review !== undefined) updates.needs_review = payload.needs_review;

    const { data: updated, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: 'Failed to update entry: ' + error.message };

    // Insert audit record for the edit
    await supabase.from('time_entry_audit').insert({
      time_entry_id: id,
      user_id: user.id, // Admin doing the edit
      event_type: 'ADMIN_EDIT',
      reason,
      metadata: { payload, previous: existing }
    });

    revalidatePath('/time-clock');
    return { success: true, data: updated };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

export async function adminCreateTimeEntry(
  targetUserId: string,
  payload: { clock_in: string; clock_out?: string; project?: string; notes?: string }
) {
  try {
    const supabase = await verifyAdmin();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: targetUserId,
        clock_in: payload.clock_in,
        clock_out: payload.clock_out || null,
        project: payload.project || '',
        notes: payload.notes || '',
        status: payload.clock_out ? 'closed' : 'open',
        manual_entry: true
      })
      .select()
      .single();

    if (error || !entry) return { success: false, error: 'Failed to create entry: ' + (error?.message || 'Unknown database error') };

    await supabase.from('time_entry_audit').insert({
      time_entry_id: entry.id,
      user_id: user.id, // Admin
      event_type: 'ADMIN_CREATE',
      reason: 'Manual admin entry creation',
      metadata: payload
    });

    revalidatePath('/time-clock');
    return { success: true, data: entry };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

export async function adminDeleteTimeEntry(id: string) {
  try {
    const supabase = await verifyAdmin();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: 'Failed to delete entry: ' + error.message };

    revalidatePath('/time-clock');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}
