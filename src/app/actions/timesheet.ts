'use server';

import { getSupabaseServer } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';

async function getUser() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return { supabase, user };
}

export async function submitTimesheet(periodStart: string, periodEnd: string) {
  try {
    const { supabase, user } = await getUser();

    // 1. Fetch entries for period
    const { data: entries } = await supabase
      .from('time_entries')
      .select('*, time_entry_breaks(*)')
      .eq('user_id', user.id)
      .gte('clock_in', periodStart)
      .lte('clock_in', periodEnd);
      
    if (!entries || entries.length === 0) {
      return { success: false, error: 'No entries found for this period.' };
    }

    // 2. Check for unresolved flags
    const needsReview = entries.some(e => e.needs_review);
    if (needsReview) {
      return { success: false, error: 'Cannot submit timesheet with unresolved review flags.' };
    }

    // 3. Fetch contractor settings for snapshot
    const { data: settings } = await supabase
      .from('contractor_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!settings) return { success: false, error: 'Contractor settings not found.' };

    // 4. Calculate totals (Simplified for now, real calculation snapshot)
    const totals = {
      regular_hours: 0,
      additional_hours: 0,
      gross_earnings: 0
    };

    // 5. Upsert period
    const { data: period, error: pError } = await supabase
      .from('timesheet_periods')
      .upsert({
        user_id: user.id,
        period_start: periodStart,
        period_end: periodEnd,
        status: 'submitted',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, period_start' })
      .select()
      .single();

    if (pError || !period) return { success: false, error: 'Failed to create/update timesheet period.' };

    // 6. Find current max version for this period
    const { data: existingSubmissions } = await supabase
      .from('timesheet_submissions')
      .select('version')
      .eq('timesheet_period_id', period.id)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = (existingSubmissions?.[0]?.version || 0) + 1;

    // 7. Insert submission snapshot
    const { data: submission, error: sError } = await supabase
      .from('timesheet_submissions')
      .insert({
        timesheet_period_id: period.id,
        user_id: user.id,
        version: nextVersion,
        period_start: periodStart,
        period_end: periodEnd,
        contractor_settings_snapshot: settings,
        entries_snapshot: entries,
        totals_snapshot: totals,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sError) return { success: false, error: 'Failed to save submission snapshot.' };

    revalidatePath('/time-clock/timesheets');
    return { success: true, data: submission };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

export async function sendTimesheetSubmission(submissionId: string) {
  try {
    const { supabase, user } = await getUser();

    const { data: submission } = await supabase
      .from('timesheet_submissions')
      .select('*')
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .single();

    if (!submission) return { success: false, error: 'Submission not found.' };

    const { sendTimesheetEmail } = await import('@/lib/email');
    await sendTimesheetEmail(submission);
    
    // Update status
    await supabase
      .from('timesheet_submissions')
      .update({ email_status: 'sent' })
      .eq('id', submissionId);
      
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

export async function emailTimeClockReport(params: any) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { sendTimeClockReportEmail } = await import('@/lib/email');
    await sendTimeClockReportEmail(params);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}
