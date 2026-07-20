import { getSupabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import TimeClockDashboard from '@/components/time-clock/TimeClockDashboard';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';

export default async function TimeClockPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Authentication Required</h1>
        <p className="text-slate-600 mb-6">
          The Time Clock module strictly requires a real Supabase Auth session for security and Row Level Security compliance. Mock local storage sessions are not supported for time entries.
        </p>
        <p className="text-sm text-slate-500">
          Please log out and sign in with a valid Supabase account to use this feature.
        </p>
      </div>
    );
  }

  const isUserAdmin = isAdmin(user.email);

  // Fetch contractor settings to see if they are configured
  const { data: settings } = await supabase
    .from('contractor_settings')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  if (!settings) {
    // Force them to configure settings first
    redirect('/time-clock/settings');
  }

  // Fetch active entry if any
  const { data: activeEntry } = await supabase
    .from('time_entries')
    .select(`
      *,
      breaks:time_entry_breaks(*)
    `)
    .eq('user_id', user.id)
    .is('clock_out', null)
    .is('voided_at', null)
    .single();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Time Clock</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isUserAdmin ? "Logged in as Admin (Full Timesheet Controls)" : "Logged in as Contractor"}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 md:mt-0 text-sm">
          <Link href="/time-clock/timesheets" className="text-blue-600 hover:underline font-medium">My Timesheet</Link>
          <Link href="/time-clock/reports" className="text-blue-600 hover:underline font-medium">My Reports</Link>
          <Link href="/time-clock/settings" className="text-slate-600 hover:underline font-medium">My Settings</Link>
          {isUserAdmin && (
            <>
              <span className="text-slate-300">|</span>
              <Link href="/time-clock/onboard" className="text-amber-600 hover:underline font-semibold">Onboard Employee</Link>
              <Link href="/time-clock/admin-timesheets" className="text-amber-600 hover:underline font-semibold">Admin Panel</Link>
            </>
          )}
        </div>
      </div>

      <TimeClockDashboard activeEntry={activeEntry} />
    </div>
  );
}
