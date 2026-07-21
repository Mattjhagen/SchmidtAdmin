// Admin — Customer portal message threads.
// Contractors see every quote request with a customer email and reply inline;
// replies email the customer a link back to their portal.
// Location: src/app/(app)/messages/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { isSupabaseConfigured } from '@/lib/db';
import { Loader2, MessageSquare, Send, Phone, Mail } from 'lucide-react';

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
  phone: string;
  email: string | null;
  address: string | null;
  service: string;
  details: string | null;
  status: string;
  messages: PortalMessage[];
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AdminMessages() {
  const [requests, setRequests] = useState<PortalRequest[] | null>(null);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { setRequests([]); return; }
    (async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('Sign in with your Supabase admin account to view messages.');
        const res = await fetch('/api/portal/requests', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load messages.');
        if (!data.isAdmin) throw new Error('Your account does not have admin access.');
        setRequests(data.requests);
        const withMsgs = (data.requests as PortalRequest[]).find(r => r.messages.length > 0);
        setSelected((withMsgs || data.requests[0])?.id ?? null);
      } catch (err: any) {
        setError(err.message);
        setRequests([]);
      }
    })();
  }, []);

  async function reply(requestId: string) {
    const body = (drafts[requestId] || '').trim();
    if (!body) return;
    setSending(s => ({ ...s, [requestId]: true }));
    try {
      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Session expired — sign in again.');
      const res = await fetch('/api/portal/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  if (!isSupabaseConfigured) {
    return (
      <div className="py-16 text-center text-slate-500">
        Customer messages require Supabase — not available in demo mode.
      </div>
    );
  }

  if (requests === null) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  const current = requests.find(r => r.id === selected) || null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-blue-600" /> Customer Messages
        </h1>
        <p className="text-sm text-slate-500 mt-1">Portal threads with customers. Replies are emailed to them with a link back to their portal.</p>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      {requests.length === 0 && !error ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
          No quote requests with customer emails yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-[320px_1fr] gap-6">
          {/* Thread list */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden self-start max-h-[70vh] overflow-y-auto">
            {requests.map(r => (
              <button key={r.id} onClick={() => setSelected(r.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-slate-100 cursor-pointer ${selected === r.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-slate-900 truncate">{r.name}</span>
                  {r.messages.length > 0 && (
                    <span className="text-[10px] font-bold bg-blue-600 text-white rounded-full px-2 py-0.5">{r.messages.length}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{r.service}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {r.messages.length
                    ? `Last: ${fmtTime(r.messages[r.messages.length - 1].created_at)}`
                    : `Requested ${fmtTime(r.created_at)}`}
                </p>
              </button>
            ))}
          </div>

          {/* Thread view */}
          {current ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden self-start">
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-bold text-slate-900">{current.name} — {current.service}</h2>
                  <span className="text-xs font-semibold text-slate-500 uppercase">{current.status}</span>
                </div>
                <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-slate-500">
                  <a href={`tel:${current.phone.replace(/\D/g, '')}`} className="flex items-center gap-1 hover:text-blue-600"><Phone className="h-3 w-3" />{current.phone}</a>
                  {current.email && <a href={`mailto:${current.email}`} className="flex items-center gap-1 hover:text-blue-600"><Mail className="h-3 w-3" />{current.email}</a>}
                  {current.address && <span>{current.address}</span>}
                </div>
              </div>

              {current.details && (
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/60">
                  <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">{current.details}</p>
                </div>
              )}

              <div className="px-6 py-5 max-h-[45vh] overflow-y-auto">
                {current.messages.length === 0 ? (
                  <p className="text-sm text-slate-400">No messages yet. Send the first note below.</p>
                ) : (
                  <div className="space-y-3">
                    {current.messages.map(m => (
                      <div key={m.id} className={`flex ${m.sender_role === 'contractor' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                          m.sender_role === 'contractor'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        }`}>
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p className={`text-[10px] mt-1 ${m.sender_role === 'contractor' ? 'text-blue-200' : 'text-slate-400'}`}>
                            {m.sender_role === 'contractor' ? 'Schmidt team' : (m.sender_name || 'Customer')} · {fmtTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
                <textarea
                  value={drafts[current.id] || ''}
                  onChange={e => setDrafts(d => ({ ...d, [current.id]: e.target.value }))}
                  rows={2}
                  placeholder={`Reply to ${current.name}…`}
                  className="flex-1 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => reply(current.id)}
                  disabled={sending[current.id] || !(drafts[current.id] || '').trim()}
                  className="self-end bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 cursor-pointer"
                  aria-label="Send reply"
                >
                  {sending[current.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400">Select a thread</div>
          )}
        </div>
      )}
    </div>
  );
}
