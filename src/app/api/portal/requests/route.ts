// Customer portal: list the caller's quote requests with their message threads.
// Admins receive every request that has a customer email attached.
// Location: src/app/api/portal/requests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCaller, getServiceClient } from '@/lib/portalAuth';

export async function GET(req: NextRequest) {
  const caller = await getCaller(req);
  if (!caller) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Portal is not configured.' }, { status: 503 });
  }

  let query = supabase
    .from('quote_requests')
    .select('id, created_at, name, phone, email, address, service, details, status')
    .order('created_at', { ascending: false });

  if (caller.isAdmin) {
    query = query.not('email', 'is', null);
  } else {
    query = query.ilike('email', caller.email);
  }

  const { data: requests, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (requests || []).map(r => r.id);
  let messages: any[] = [];
  if (ids.length) {
    const { data: msgs, error: msgErr } = await supabase
      .from('portal_messages')
      .select('id, quote_request_id, sender_role, sender_name, body, created_at')
      .in('quote_request_id', ids)
      .order('created_at', { ascending: true });
    if (msgErr) {
      return NextResponse.json({ error: msgErr.message }, { status: 500 });
    }
    messages = msgs || [];
  }

  const byRequest: Record<string, any[]> = {};
  for (const m of messages) {
    (byRequest[m.quote_request_id] ||= []).push(m);
  }

  return NextResponse.json({
    isAdmin: caller.isAdmin,
    requests: (requests || []).map(r => ({ ...r, messages: byRequest[r.id] || [] })),
  });
}
