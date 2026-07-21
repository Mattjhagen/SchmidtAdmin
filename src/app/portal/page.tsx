// Customer Portal — track quote requests and message the Schmidt team.
// First-time visitors create a password; returning customers sign in.
// Location: src/app/portal/page.tsx

'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { isSupabaseConfigured } from '@/lib/db';
import type { Session } from '@supabase/supabase-js';
import { Loader2, LogOut, MessageSquare, Send, CheckCircle } from 'lucide-react';

interface PortalMessage {
  id: string;
  quote_request_id: string;
  sender_role: 'customer' | 'contractor';
  sender_name: string | null;
  body: string;
  created_at: string;
}

interface PortalRequest {
  id: string;
  created_at: string;
  name: string;
  service: string;
  address: string | null;
  details: string | null;
  status: 'pending' | 'contacted' | 'converted' | 'dismissed';
  messages: PortalMessage[];
}

const STATUS_LABELS: Record<PortalRequest['status'], { label: string; cls: string }> = {
  pending:   { label: 'Received — review in progress', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  contacted: { label: 'In contact', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  converted: { label: 'Project scheduled', cls: 'bg-green-50 text-green-700 border-green-200' },
  dismissed: { label: 'Closed', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function CustomerPortal() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // auth form state
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [notice, setNotice] = useState('');

  // dashboard state
  const [requests, setRequests] = useState<PortalRequest[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isSupabaseConfigured) { setCheckingSession(false); return; }
    const supabase = getSupabaseBrowser();
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get('email');
    if (prefill) setEmail(prefill);

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadRequests = useCallback(async (s: Session) => {
    setLoadError('');
    try {
      const res = await fetch('/api/portal/requests', {
        headers: { Authorization: `Bearer ${s.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load your requests.');
      setRequests(data.requests);
    } catch (err: any) {
      setLoadError(err.message);
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    if (session) loadRequests(session);
  }, [session, loadRequests]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setNotice('');
    if (!email || !password) { setAuthError('Email and password are required.'); return; }
    if (mode === 'signup' && password !== confirm) { setAuthError('Passwords do not match.'); return; }
    if (mode === 'signup' && password.length < 8) { setAuthError('Password must be at least 8 characters.'); return; }

    setAuthBusy(true);
    const supabase = getSupabaseBrowser();
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/portal` },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice('Account created! Check your email for a confirmation link, then sign in here.');
          setMode('login');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Something went wrong.');
    }
    setAuthBusy(false);
  }

  async function handleForgot() {
    setAuthError('');
    setNotice('');
    if (!email) { setAuthError('Enter your email above first.'); return; }
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/reset`,
    });
    if (error) setAuthError(error.message);
    else setNotice(`Password reset link sent to ${email}.`);
  }

  async function sendMessage(requestId: string) {
    if (!session) return;
    const body = (drafts[requestId] || '').trim();
    if (!body) return;
    setSending(s => ({ ...s, [requestId]: true }));
    try {
      const res = await fetch('/api/portal/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ quote_request_id: requestId, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send.');
      setDrafts(d => ({ ...d, [requestId]: '' }));
      setRequests(reqs => (reqs || []).map(r =>
        r.id === requestId ? { ...r, messages: [...r.messages, data.message] } : r
      ));
    } catch (err: any) {
      alert(err.message);
    }
    setSending(s => ({ ...s, [requestId]: false }));
  }

  const header = (
    <header className="w-full bg-slate-900 border-b border-slate-800 text-white py-4 px-6">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Schmidt Construction" width={120} height={40} className="h-9 w-auto bg-white rounded-md p-0.5" />
          <span className="font-bold text-lg hidden sm:inline">Customer Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="tel:+14023202600" className="text-sm font-bold" style={{ color: '#4f94f2' }}>(402) 320-2600</a>
          {session && (
            <button
              onClick={async () => { await getSupabaseBrowser().auth.signOut(); setRequests(null); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-50">
        {header}
        <div className="max-w-3xl mx-auto px-6 py-16 text-center text-slate-500">
          The customer portal isn&apos;t available in this environment. Please call us at{' '}
          <a href="tel:+14023202600" className="text-blue-600 font-semibold">(402) 320-2600</a>.
        </div>
      </div>
    );
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50">
        {header}
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      </div>
    );
  }

  // ── Signed out: login / first-time signup ─────────────────────
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50">
        {header}
        <div className="max-w-md mx-auto px-6 py-12">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
            {mode === 'login' ? 'Sign in to your portal' : 'Create your portal account'}
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            {mode === 'login'
              ? 'Track your estimate request and message our team.'
              : 'First time here? Use the email from your quote request and create a password.'}
          </p>

          <div className="flex rounded-lg border border-slate-200 bg-white p-1 mb-6 text-sm font-semibold">
            <button onClick={() => { setMode('login'); setAuthError(''); }}
              className={`flex-1 py-2 rounded-md cursor-pointer ${mode === 'login' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
              Sign in
            </button>
            <button onClick={() => { setMode('signup'); setAuthError(''); }}
              className={`flex-1 py-2 rounded-md cursor-pointer ${mode === 'signup' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
              First time? Create password
            </button>
          </div>

          {notice && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm px-4 py-3">{notice}</div>}
          {authError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">{authError}</div>}

          <form onSubmit={handleAuth} className="space-y-4 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                {mode === 'signup' ? 'Create password' : 'Password'}
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} />
            </div>
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Repeat password" />
              </div>
            )}
            <button type="submit" disabled={authBusy}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm cursor-pointer">
              {authBusy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
            {mode === 'login' && (
              <button type="button" onClick={handleForgot} className="w-full text-xs text-slate-500 hover:text-blue-600 cursor-pointer">
                Forgot your password?
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // ── Signed in: dashboard ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {header}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Your project requests</h1>
        <p className="text-slate-500 text-sm mb-8">Signed in as {session.user.email}. Add remarks below — our team gets notified and replies right here.</p>

        {loadError && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">{loadError}</div>}

        {requests === null ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
        ) : requests.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-600 font-semibold mb-2">No requests found for {session.user.email}</p>
            <p className="text-slate-500 text-sm mb-6">If you submitted a quote with a different email, sign in with that address — or start a new request.</p>
            <a href="/quote" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm">Get a Free Estimate →</a>
          </div>
        ) : (
          <div className="space-y-8">
            {requests.map(r => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">{r.service}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Requested {fmtDate(r.created_at)}{r.address ? ` · ${r.address}` : ''}</p>
                  </div>
                  <span className={`text-xs font-bold border rounded-full px-3 py-1 ${STATUS_LABELS[r.status].cls}`}>
                    {STATUS_LABELS[r.status].label}
                  </span>
                </div>

                {r.details && (
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Project details</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{r.details}</p>
                  </div>
                )}

                <div className="px-6 py-5">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">
                    <MessageSquare className="h-3.5 w-3.5" /> Messages
                  </p>
                  {r.messages.length === 0 ? (
                    <p className="text-sm text-slate-400 mb-4">No messages yet — questions or extra details? Send us a note below.</p>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {r.messages.map(m => (
                        <div key={m.id} className={`flex ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                            m.sender_role === 'customer'
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                          }`}>
                            <p className="whitespace-pre-wrap">{m.body}</p>
                            <p className={`text-[10px] mt-1 ${m.sender_role === 'customer' ? 'text-blue-200' : 'text-slate-400'}`}>
                              {m.sender_role === 'customer' ? 'You' : (m.sender_name || 'Schmidt Construction')} · {fmtTime(m.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={drafts[r.id] || ''}
                      onChange={e => setDrafts(d => ({ ...d, [r.id]: e.target.value }))}
                      rows={2}
                      placeholder="Add a remark or question for our team…"
                      className="flex-1 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => sendMessage(r.id)}
                      disabled={sending[r.id] || !(drafts[r.id] || '').trim()}
                      className="self-end bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 cursor-pointer"
                      aria-label="Send message"
                    >
                      {sending[r.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          Messages go straight to the Schmidt team — we typically reply within one business day.
        </div>
      </div>
    </div>
  );
}
