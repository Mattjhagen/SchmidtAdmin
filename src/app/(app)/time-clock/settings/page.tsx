import { getSupabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import ContractorSettingsForm from '@/components/time-clock/ContractorSettingsForm';
import Link from 'next/link';

export default async function SettingsPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Authentication Required</h1>
        <p className="text-slate-600 mb-6">
          The Time Clock module strictly requires a real Supabase Auth session for security and Row Level Security compliance. Mock local storage sessions are not supported for time entries.
        </p>
      </div>
    );
  }

  const { data: settings } = await supabase
    .from('contractor_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Contractor Earnings & Time Settings</h1>
        <div className="space-x-4">
          <Link href="/time-clock" className="text-blue-600 hover:underline">Back to Time Clock</Link>
          <Link href="/time-clock/reports" className="text-blue-600 hover:underline">Tax Reports</Link>
        </div>
      </div>
      <ContractorSettingsForm initialSettings={settings} />
    </div>
  );
}
