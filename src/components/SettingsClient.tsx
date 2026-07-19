'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Mail,
  CheckCircle,
  AlertCircle,
  Send,
  Shield,
  ExternalLink,
  TriangleAlert,
} from 'lucide-react';
import { isDemoMode } from '@/lib/db';

type ToastState = { type: 'success' | 'error'; message: string } | null;

interface Props {
  emailOverrideTo: string | null;
}

export default function SettingsClient({ emailOverrideTo }: Props) {
  const [sendingTest, setSendingTest] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setAuthLoading(false);
      return;
    }
    (async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
        if (supabaseUrl && supabaseAnonKey) {
          const sb = createClient(supabaseUrl, supabaseAnonKey);
          const { data } = await sb.auth.getSession();
          setUserEmail(data.session?.user?.email ?? null);
          setAuthToken(data.session?.access_token ?? null);
        }
      } catch {
        // no session
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 6000);
  };

  const handleSendTestEmail = async () => {
    if (isDemoMode) {
      showToast('error', 'Test email is not available in demo mode. Configure Supabase to enable it.');
      return;
    }

    if (!authToken) {
      showToast('error', 'No active session found. Please log in and try again.');
      return;
    }

    try {
      setSendingTest(true);

      const res = await fetch('/api/proposals/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        showToast('error', json.error ?? 'Failed to send test email.');
        return;
      }

      const destination = emailOverrideTo ?? json.sentTo;
      showToast(
        'success',
        emailOverrideTo
          ? `Test email redirected to ${destination} (EMAIL_OVERRIDE_TO is active).`
          : `Test email sent to ${destination}. Check your inbox!`
      );
    } catch (e) {
      console.error(e);
      showToast('error', 'Unexpected error sending test email.');
    } finally {
      setSendingTest(false);
    }
  };

  const buttonDisabled = sendingTest || authLoading || (!isDemoMode && !userEmail);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-4 rounded-xl shadow-xl border text-sm font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <div className="bg-blue-700 p-2.5 rounded-xl">
          <Settings className="h-5 w-5 text-slate-950" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
          <p className="text-sm text-slate-500 mt-0.5">System configuration and administration tools</p>
        </div>
      </div>

      {/* Email Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 premium-shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center space-x-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">Email Configuration</h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Active config summary */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3 text-sm">
            <p className="font-bold text-slate-700 text-xs uppercase tracking-wider">Active Configuration</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <span className="text-slate-500 font-medium">Email Provider</span>
              <span className="font-semibold text-slate-800">Resend</span>

              <span className="text-slate-500 font-medium">From Address</span>
              <span className="font-mono text-xs font-semibold text-slate-800">
                Mikiel@schmidt-construction.com
              </span>

              <span className="text-slate-500 font-medium">Verified Domain</span>
              <span className="font-semibold text-green-700 flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>schmidt-construction.com</span>
              </span>

              <span className="text-slate-500 font-medium">Reply-To</span>
              <span className="font-mono text-xs font-semibold text-slate-800">
                mikiel@schmidt-construction.com
              </span>

              <span className="text-slate-500 font-medium">API Key</span>
              <span className="text-xs font-semibold text-slate-500">
                {isDemoMode
                  ? '⚠ Not configured (demo mode)'
                  : '✓ Configured server-side only'}
              </span>
            </div>
          </div>

          {/* Email Override Status */}
          <div
            className={`rounded-xl border p-5 space-y-2 ${
              emailOverrideTo
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <TriangleAlert
                className={`h-4 w-4 shrink-0 ${
                  emailOverrideTo ? 'text-yellow-600' : 'text-slate-400'
                }`}
              />
              <p className="font-bold text-sm text-slate-800">Email Override</p>
              {emailOverrideTo ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-200 text-yellow-900 uppercase tracking-wide">
                  Enabled
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 uppercase tracking-wide">
                  Disabled
                </span>
              )}
            </div>

            {emailOverrideTo ? (
              <div className="space-y-1 text-sm">
                <p className="text-yellow-800 font-medium">
                  All outbound emails are being redirected to:
                </p>
                <p className="font-mono font-bold text-yellow-900">{emailOverrideTo}</p>
                <p className="text-xs text-yellow-700">
                  Set via <code className="bg-yellow-100 px-1 rounded">EMAIL_OVERRIDE_TO</code>. Remove this variable to restore normal delivery.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Set <code className="bg-slate-100 px-1 rounded">EMAIL_OVERRIDE_TO</code> in your environment to redirect all emails to a single inbox during development or QA.
              </p>
            )}
          </div>

          {/* Security note */}
          <div className="flex items-start space-x-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <Shield className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div className="text-xs text-green-800 space-y-0.5">
              <p className="font-bold">API Key Security</p>
              <p className="font-medium text-green-700">
                <code className="bg-green-100 px-1 rounded">RESEND_API_KEY</code> and{' '}
                <code className="bg-green-100 px-1 rounded">EMAIL_OVERRIDE_TO</code> are
                loaded server-side only. Neither variable is included in browser bundles or
                client components.
              </p>
            </div>
          </div>

          {/* Send Test Email */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-3">
            <div>
              <p className="font-bold text-slate-800 text-sm">Send Test Email</p>
              <p className="text-xs text-slate-500 mt-1">
                Sends a sample proposal email to verify branding, formatting, and deliverability.
                {emailOverrideTo
                  ? ` Email override is active — the test will be delivered to ${emailOverrideTo}.`
                  : ' The email will be delivered to your logged-in account address.'}
              </p>
            </div>

            <button
              onClick={handleSendTestEmail}
              disabled={buttonDisabled}
              className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <Send className="h-4 w-4 shrink-0" />
              <span>
                {sendingTest
                  ? 'Sending…'
                  : authLoading
                  ? 'Checking session…'
                  : 'Send Test Email'}
              </span>
            </button>

            {!authLoading && !isDemoMode && !userEmail && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-medium">
                Log in with an email address to send a test email.
              </p>
            )}

            {isDemoMode && (
              <p className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 font-medium">
                Not available in demo mode. Configure Supabase credentials to enable real email sending.
              </p>
            )}
          </div>

          {/* Resend Dashboard Link */}
          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-4">
            <span>Manage domains, API keys, and delivery logs in the Resend dashboard.</span>
            <a
              href="https://resend.com/domains"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold"
            >
              <span>Resend Dashboard</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
