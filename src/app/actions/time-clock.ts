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
  const { supabase, user } = await getUser();

  // Check for active shift
  const { data: active } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .is('voided_at', null)
    .single();

  if (active) throw new Error('You are already clocked in.');

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

  if (error || !entry) throw new Error('Failed to clock in');

  // Audit
  await supabase.from('time_entry_audit').insert({
    time_entry_id: entry.id,
    user_id: user.id,
    event_type: 'CREATE',
    metadata: payload
  });

  revalidatePath('/time-clock');
  return entry;
}

export async function clockOut() {
  const { supabase, user } = await getUser();

  // Find active shift
  const { data: active } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .is('voided_at', null)
    .single();

  if (!active) throw new Error('You are not currently clocked in.');

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

  if (error) throw new Error('Failed to clock out');

  // Audit
  await supabase.from('time_entry_audit').insert({
    time_entry_id: active.id,
    user_id: user.id,
    event_type: 'CLOCK_OUT',
    new_value: clockOutTime
  });

  revalidatePath('/time-clock');
  return entry;
}

export async function startBreak() {
  const { supabase, user } = await getUser();

  const { data: active } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .is('voided_at', null)
    .single();

  if (!active) throw new Error('You must be clocked in to start a break.');

  // Check for active break
  const { data: activeBreak } = await supabase
    .from('time_entry_breaks')
    .select('id')
    .eq('time_entry_id', active.id)
    .is('end_time', null)
    .single();

  if (activeBreak) throw new Error('You are already on a break.');

  const { data: b, error } = await supabase
    .from('time_entry_breaks')
    .insert({
      time_entry_id: active.id,
      start_time: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error('Failed to start break');

  await supabase.from('time_entry_audit').insert({
    time_entry_id: active.id,
    user_id: user.id,
    event_type: 'START_BREAK'
  });

  revalidatePath('/time-clock');
  return b;
}

export async function endBreak() {
  const { supabase, user } = await getUser();

  const { data: active } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .is('voided_at', null)
    .single();

  if (!active) throw new Error('No active shift found.');

  // Check for active break
  const { data: activeBreak } = await supabase
    .from('time_entry_breaks')
    .select('id')
    .eq('time_entry_id', active.id)
    .is('end_time', null)
    .single();

  if (!activeBreak) throw new Error('You are not currently on a break.');

  const endTime = new Date().toISOString();
  
  const { data: b, error } = await supabase
    .from('time_entry_breaks')
    .update({ end_time: endTime, updated_at: endTime })
    .eq('id', activeBreak.id)
    .select()
    .single();

  if (error) throw new Error('Failed to end break');

  await supabase.from('time_entry_audit').insert({
    time_entry_id: active.id,
    user_id: user.id,
    event_type: 'END_BREAK'
  });

  revalidatePath('/time-clock');
  return b;
}

export async function editTimeEntry(
  id: string,
  payload: Partial<TimeEntry>,
  reason: string
) {
  const { supabase, user } = await getUser();
  if (!reason || reason.trim() === '') throw new Error('A reason is required to edit a time entry.');

  const { data: existing } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!existing) throw new Error('Time entry not found or unauthorized');

  // Basic overlap validation should happen here or via constraints
  
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

  if (error) throw new Error('Failed to update entry');

  // Insert audit record for the edit
  await supabase.from('time_entry_audit').insert({
    time_entry_id: id,
    user_id: user.id,
    event_type: 'EDIT',
    reason,
    metadata: { payload, previous: existing }
  });

  revalidatePath('/time-clock');
  return updated;
}

export async function resolveReviewFlag(id: string) {
  const { supabase, user } = await getUser();

  const { error } = await supabase
    .from('time_entries')
    .update({ needs_review: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error('Failed to resolve flag');

  await supabase.from('time_entry_audit').insert({
    time_entry_id: id,
    user_id: user.id,
    event_type: 'REVIEW_RESOLVED'
  });

  revalidatePath('/time-clock');
}
