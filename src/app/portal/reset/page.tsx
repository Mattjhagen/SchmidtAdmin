// Customer Portal — set a new password after following a reset link.
// Location: src/app/portal/reset/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { isSupabaseConfigured } from '@/lib/db';

export default function PortalPasswordReset() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    // The recovery link signs the user in via URL hash; wait for the session.
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setReady(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    const { error: err } = await getSupabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (err) { setError(err.message); return; }
    router.push('/portal');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 mb-1">Set a new password</h1>
        <p className="text-slate-500 text-sm mb-6">Choose a new password for your Schmidt Construction portal account.</p>
        {!ready ? (
          <p className="text-sm text-slate-500">
            Waiting for your reset link… If you got here directly, request a new link from the{' '}
            <a href="/portal" className="text-blue-600 font-semibold">portal sign-in page</a>.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password"
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={busy}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm cursor-pointer">
              {busy ? 'Saving…' : 'Save password & continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
