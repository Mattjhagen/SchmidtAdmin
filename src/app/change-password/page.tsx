'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { KeyRound, ShieldAlert, Check } from 'lucide-react';
import Image from 'next/image';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const user = auth.getSessionUser();
    if (!user) {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabaseBrowser();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: { force_password_change: false }
      });

      if (updateError) throw updateError;

      // Update local storage session
      const user = auth.getSessionUser();
      if (user) {
        user.forcePasswordChange = false;
        localStorage.setItem('schmidt_auth_session', JSON.stringify(user));
        // Reset cookies
        document.cookie = `schmidt_admin_session=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(29,78,216,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(15,23,42,0.8),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 text-white rounded-2xl border border-slate-800 p-8 premium-shadow relative z-10 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Image src="/icon.png" alt="Schmidt Construction" width={96} height={96} className="h-24 w-24 rounded-2xl" priority />
          <span className="text-xs text-blue-400 font-semibold uppercase tracking-widest">
            Security Requirements
          </span>
          <h2 className="text-xl font-bold text-center text-slate-100">Set Your New Password</h2>
          <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">
            As a newly onboarded employee, you must choose a secure personal password before continuing.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-950/50 border border-emerald-800 p-6 rounded-2xl text-center space-y-3">
            <div className="inline-flex p-3 bg-emerald-900/40 rounded-full text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-emerald-300">Password Saved Successfully!</p>
            <p className="text-xs text-emerald-400">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-900 rounded-xl text-red-400 font-medium flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-slate-400">New Secure Password *</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400">Confirm New Password *</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-100 hover:bg-white text-slate-950 font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer text-xs"
            >
              {loading ? "Updating Password..." : "Update Password & Continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
