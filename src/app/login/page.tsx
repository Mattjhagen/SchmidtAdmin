// Schmidt Construction Login Screen
// Location: src/app/login/page.tsx

'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { auth } from '../../lib/auth';
import { isDemoMode } from '../../lib/db';
import { Mail, AlertTriangle, KeyRound } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirect = searchParams.get('next') || '/dashboard';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError(null);
      await auth.login(email, password);
      router.push(redirect);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = async () => {
    try {
      setLoading(true);
      setError(null);
      await auth.login('estimator@schmidtconstruction.com');
      router.push(redirect);
    } catch (err: any) {
      console.error(err);
      setError('Error triggering demo session bypass.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-50 overflow-y-auto">
      {/* Background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(29,78,216,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(15,23,42,0.8),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 text-white rounded-2xl border border-slate-800 p-8 premium-shadow relative z-10 space-y-6">
        {/* Brand Banner */}
        <div className="flex flex-col items-center space-y-4">
          <Image src="/icon.png" alt="Schmidt Construction" width={96} height={96} className="h-24 w-24 rounded-2xl" priority />
          <span className="text-xs text-blue-400 font-semibold uppercase tracking-widest">
            Estimating &amp; Proposals
          </span>
        </div>

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="bg-blue-900/20 border border-blue-700/30 p-4 rounded-xl text-xs text-blue-300 space-y-2">
            <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-[10px]">
              <AlertTriangle className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Demo Mode Active</span>
            </div>
            <p className="leading-relaxed font-medium">
              Supabase credentials are missing. Running in local fallback mode. You can bypass authentication with one click below.
            </p>
            <button
              type="button"
              onClick={handleDemoBypass}
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-extrabold py-2 px-3 rounded-lg transition-colors cursor-pointer text-xs"
            >
              One-Click Demo Bypass Login
            </button>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-semibold">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-900 rounded-xl text-red-400 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-slate-400">Estimator Email *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@schmidt-construction.com"
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400">Password *</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required={!isDemoMode}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isDemoMode ? "Optional in Demo Mode" : "••••••••"}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-100 hover:bg-white text-slate-950 font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer text-xs"
          >
            {loading ? "Signing In..." : "Sign In to Dashboard"}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
          <p>Schmidt Construction Estimating System © {new Date().getFullYear()}</p>
          <p className="mt-1">50+ years of family-owned craftsmanship excellence</p>
        </div>
      </div>
    </div>
  );
}
