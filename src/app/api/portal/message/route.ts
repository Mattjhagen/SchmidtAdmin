// Customer portal: post a message on a quote request thread.
// Customers may only post on their own requests; admins may post anywhere.
// Sends a notification email to the other party (non-fatal on failure).
// Location: src/app/api/portal/message/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getCaller, getServiceClient } from '@/lib/portalAuth';
import { ADMIN_EMAILS } from '@/lib/auth';

const PORTAL_URL = 'https://schmidtportals.netlify.app/portal';

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function notificationHtml(opts: { heading: string; intro: string; body: string; cta: string; ctaUrl: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>${opts.heading}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0f172a;padding:28px 40px;">
          <p style="margin:0;color:#4f94f2;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Schmidt Construction Portal</p>
          <p style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;">${opts.heading}</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px;">${opts.intro}</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 22px;margin-bottom:24px;">
            <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(opts.body)}</p>
          </div>
          <a href="${opts.ctaUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;">${opts.cta}</a>
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">Schmidt Construction · Omaha, NE · Family-owned since 1973</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const caller = await getCaller(req);
  if (!caller) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Portal is not configured.' }, { status: 503 });
  }

  let payload: { quote_request_id?: string; body?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const quoteRequestId = (payload.quote_request_id || '').trim();
  const body = (payload.body || '').trim();
  if (!quoteRequestId || !body) {
    return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
  }
  if (body.length > 5000) {
    return NextResponse.json({ error: 'Message is too long (5000 characters max).' }, { status: 400 });
  }

  const { data: request, error: reqErr } = await supabase
    .from('quote_requests')
    .select('id, name, email, service')
    .eq('id', quoteRequestId)
    .single();
  if (reqErr || !request) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  }

  const ownsRequest = (request.email || '').toLowerCase() === caller.email.toLowerCase();
  if (!caller.isAdmin && !ownsRequest) {
    return NextResponse.json({ error: 'You do not have access to this request.' }, { status: 403 });
  }

  const senderRole = caller.isAdmin ? 'contractor' : 'customer';
  const { data: message, error: insErr } = await supabase
    .from('portal_messages')
    .insert({
      quote_request_id: quoteRequestId,
      sender_role: senderRole,
      sender_name: caller.isAdmin ? 'Schmidt Construction' : (request.name || caller.name),
      sender_email: caller.email,
      body,
    })
    .select('id, quote_request_id, sender_role, sender_name, body, created_at')
    .single();
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  // Notify the other party — never fail the message post over email issues.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    if (senderRole === 'customer') {
      await resend.emails.send({
        from: 'Schmidt Construction Portal <Mikiel@schmidt-construction.com>',
        to: ADMIN_EMAILS.filter(e => e !== 'admin@schmidt-construction.com'),
        replyTo: caller.email,
        subject: `💬 New portal message — ${request.service} — ${request.name}`,
        html: notificationHtml({
          heading: `New message from ${request.name}`,
          intro: `${request.name} added a remark on their <strong>${escapeHtml(request.service)}</strong> request:`,
          body,
          cta: 'Reply in the dashboard →',
          ctaUrl: 'https://schmidtportals.netlify.app/messages',
        }),
      });
    } else if (request.email) {
      await resend.emails.send({
        from: 'Schmidt Construction <Mikiel@schmidt-construction.com>',
        to: request.email,
        subject: `New message about your ${request.service} request — Schmidt Construction`,
        html: notificationHtml({
          heading: 'You have a new message',
          intro: `Schmidt Construction replied on your <strong>${escapeHtml(request.service)}</strong> request:`,
          body,
          cta: 'View & reply in your portal →',
          ctaUrl: `${PORTAL_URL}?email=${encodeURIComponent(request.email)}`,
        }),
      });
    }
  } catch {
    // ignore notification failures
  }

  return NextResponse.json({ success: true, message });
}
