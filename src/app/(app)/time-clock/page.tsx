import { getSupabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import TimeClockDashboard from '@/components/time-clock/TimeClockDashboard';
import Link from 'next/link';

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

  // Fetch contractor settings to see if they are configured
  const { data: settings } = await supabase
    .from('contractor_settings')
    .select('id')
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Time Clock</h1>
        <div className="space-x-4">
          <Link href="/time-clock/timesheets" className="text-blue-600 hover:underline">Timesheets</Link>
          <Link href="/time-clock/reports" className="text-blue-600 hover:underline">Tax Reports</Link>
          <Link href="/time-clock/settings" className="text-slate-600 hover:underline">Settings</Link>
        </div>
      </div>

      <TimeClockDashboard activeEntry={activeEntry} />
    </div>
  );
}
