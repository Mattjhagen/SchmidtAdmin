'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';
import { TimeEntry, TimeEntryBreak } from '@/lib/types';
import { revalidatePath } from 'next/cache';

async function getUser() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return { supabase, user };
}

export async function clockIn(payload: { project?: string; notes?: string }) {
  try {
    const { supabase, user } = await getUser();

    // Check for active shift
    const { data: active } = await supabase
      .from('time_entries')
      .select('id')
      .eq('user_id', user.id)
      .is('clock_out', null)
      .is('voided_at', null)
      .single();

    if (active) return { success: false, error: 'You are already clocked in.' };

    const clockInTime = new Date().toISOString();

    // Create entry
    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        clock_in: clockInTime,
        project: payload.project,
        notes: payload.notes,
        status: 'open'
      })
      .select()
      .single();

    if (error || !entry) return { success: false, error: 'Failed to clock in' };

    // Audit
    await supabase.from('time_entry_audit').insert({
      time_entry_id: entry.id,
      user_id: user.id,
      event_type: 'CREATE',
      metadata: payload
    });

    revalidatePath('/time-clock');
    return { success: true, data: entry };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

export async function clockOut() {
  try {
    const { supabase, user } = await getUser();

    // Find active shift
    const { data: active } = await supabase
      .from('time_entries')
      .select('id')
      .eq('user_id', user.id)
      .is('clock_out', null)
      .is('voided_at', null)
      .single();

    if (!active) return { success: false, error: 'You are not currently clocked in.' };

    const clockOutTime = new Date().toISOString();

    // Close any open breaks
    await supabase
      .from('time_entry_breaks')
      .update({ end_time: clockOutTime, updated_at: clockOutTime })
      .eq('time_entry_id', active.id)
      .is('end_time', null);

    // Close shift
    const { data: entry, error } = await supabase
      .from('time_entries')
      .update({ clock_out: clockOutTime, status: 'closed', updated_at: clockOutTime })
      .eq('id', active.id)
      .select()
      .single();

    if (error) return { success: false, error: 'Failed to clock out' };

    // Audit
    await supabase.from('time_entry_audit').insert({
      time_entry_id: active.id,
      user_id: user.id,
      event_type: 'CLOCK_OUT',
      new_value: clockOutTime
    });

    revalidatePath('/time-clock');
    return { success: true, data: entry };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

export async function startBreak() {
  try {
    const { supabase, user } = await getUser();

    const { data: active } = await supabase
      .from('time_entries')
      .select('id')
      .eq('user_id', user.id)
      .is('clock_out', null)
      .is('voided_at', null)
      .single();

    if (!active) return { success: false, error: 'You must be clocked in to start a break.' };

    // Check for active break
    const { data: activeBreak } = await supabase
      .from('time_entry_breaks')
      .select('id')
      .eq('time_entry_id', active.id)
      .is('end_time', null)
      .single();

    if (activeBreak) return { success: false, error: 'You are already on a break.' };

    const { data: b, error } = await supabase
      .from('time_entry_breaks')
      .insert({
        time_entry_id: active.id,
        start_time: new Date().toISOString()
      })
      .select()
      .single();

    if (error) return { success: false, error: 'Failed to start break' };

    await supabase.from('time_entry_audit').insert({
      time_entry_id: active.id,
      user_id: user.id,
      event_type: 'START_BREAK'
    });

    revalidatePath('/time-clock');
    return { success: true, data: b };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

export async function endBreak() {
  try {
    const { supabase, user } = await getUser();

    const { data: active } = await supabase
      .from('time_entries')
      .select('id')
      .eq('user_id', user.id)
      .is('clock_out', null)
      .is('voided_at', null)
      .single();

    if (!active) return { success: false, error: 'No active shift found.' };

    // Check for active break
    const { data: activeBreak } = await supabase
      .from('time_entry_breaks')
      .select('id')
      .eq('time_entry_id', active.id)
      .is('end_time', null)
      .single();

    if (!activeBreak) return { success: false, error: 'You are not currently on a break.' };

    const endTime = new Date().toISOString();
    
    const { data: b, error } = await supabase
      .from('time_entry_breaks')
      .update({ end_time: endTime, updated_at: endTime })
      .eq('id', activeBreak.id)
      .select()
      .single();

    if (error) return { success: false, error: 'Failed to end break' };

    await supabase.from('time_entry_audit').insert({
      time_entry_id: active.id,
      user_id: user.id,
      event_type: 'END_BREAK'
    });

    revalidatePath('/time-clock');
    return { success: true, data: b };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

export async function editTimeEntry(
  id: string,
  payload: Partial<TimeEntry>,
  reason: string
) {
  try {
    const { supabase, user } = await getUser();
    if (!reason || reason.trim() === '') return { success: false, error: 'A reason is required to edit a time entry.' };

    const { data: existing } = await supabase
      .from('time_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) return { success: false, error: 'Time entry not found or unauthorized' };

    const updates: any = { updated_at: new Date().toISOString() };
    if (payload.clock_in) updates.clock_in = payload.clock_in;
    if (payload.clock_out !== undefined) updates.clock_out = payload.clock_out;
    if (payload.project !== undefined) updates.project = payload.project;
    if (payload.notes !== undefined) updates.notes = payload.notes;

    const { data: updated, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: 'Failed to update entry' };

    // Insert audit record for the edit
    await supabase.from('time_entry_audit').insert({
      time_entry_id: id,
      user_id: user.id,
      event_type: 'EDIT',
      reason,
      metadata: { payload, previous: existing }
    });

    revalidatePath('/time-clock');
    return { success: true, data: updated };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

export async function resolveReviewFlag(id: string) {
  try {
    const { supabase, user } = await getUser();

    const { error } = await supabase
      .from('time_entries')
      .update({ needs_review: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return { success: false, error: 'Failed to resolve flag' };

    await supabase.from('time_entry_audit').insert({
      time_entry_id: id,
      user_id: user.id,
      event_type: 'REVIEW_RESOLVED'
    });

    revalidatePath('/time-clock');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}
