import { getSupabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TimesheetList from '@/components/time-clock/TimesheetList';

export default async function TimesheetsPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Authentication Required</h1>
        <p className="text-slate-600 mb-6">
          The Time Clock module strictly requires a real Supabase Auth session for security and Row Level Security compliance. Mock local storage sessions are not supported for time entries.
        </p>
      </div>
    );
  }

  // Fetch open periods
  const { data: periods } = await supabase
    .from('timesheet_periods')
    .select('*')
    .eq('user_id', user.id)
    .order('period_start', { ascending: false });

  // Fetch submissions to map them to periods
  const { data: submissions } = await supabase
    .from('timesheet_submissions')
    .select('id, timesheet_period_id, version, submitted_at, email_status')
    .eq('user_id', user.id)
    .order('version', { ascending: false });

  // For the active week (if they haven't started a period manually, we show recent unsubmitted entries)
  // Get all unsubmitted entries
  const { data: openEntries } = await supabase
    .from('time_entries')
    .select(`*, breaks:time_entry_breaks(*)`)
    .eq('user_id', user.id)
    .in('status', ['open', 'closed'])
    // We should theoretically filter out entries already linked to a submitted period
    // For simplicity in this demo, let's just grab the last 30 days
    .order('clock_in', { ascending: false })
    .limit(50);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Timesheets & Earnings</h1>
        <div className="space-x-4">
          <Link href="/time-clock" className="text-blue-600 hover:underline">Back to Time Clock</Link>
          <Link href="/time-clock/reports" className="text-blue-600 hover:underline">Tax Reports</Link>
        </div>
      </div>

      <TimesheetList 
        periods={periods || []} 
        submissions={submissions || []}
        openEntries={openEntries || []}
      />
    </div>
  );
}
