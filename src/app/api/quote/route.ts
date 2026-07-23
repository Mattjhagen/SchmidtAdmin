import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, getServiceRoleKey } from '@/lib/supabaseEnv';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getSupabaseAdmin() {
  // Use service role key for unauthenticated inserts from public API
  const key = getServiceRoleKey() || SUPABASE_ANON_KEY;
  return createClient(SUPABASE_URL, key);
}

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const name    = (fd.get('name')    as string | null)?.trim() || '';
  const phone   = (fd.get('phone')   as string | null)?.trim() || '';
  const email   = (fd.get('email')   as string | null)?.trim() || '';
  const address = (fd.get('address') as string | null)?.trim() || '';
  const service = (fd.get('service') as string | null)?.trim() || '';
  const body    = (fd.get('body')    as string | null)?.trim() || '';

  if (!name || !phone) {
    return NextResponse.json({ success: false, error: 'Name and phone are required.' }, { status: 400 });
  }

  // ── 1. Save to Supabase ──────────────────────────────────────
  const supabase = getSupabaseAdmin();
  if (supabase) {
    await supabase.from('quote_requests').insert({
      name,
      phone,
      email: email || null,
      address: address || null,
      service,
      details: body || null,
      status: 'pending',
    });
    // errors are intentionally non-fatal — email still sends
  }

  // ── 2. Email to Mikiel ───────────────────────────────────────
  const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>New Quote Request</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0f172a;padding:28px 40px;">
          <p style="margin:0;color:#f59e0b;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">⚡ New Customer Quote Request</p>
          <p style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;">Schmidt Construction Portal</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:140px;">Name</td>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Phone</td>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;"><a href="tel:${phone.replace(/\D/g,'')}" style="color:#2563eb;">${phone}</a></td></tr>
            ${email ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Email</td>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;"><a href="mailto:${email}" style="color:#2563eb;">${email}</a></td></tr>` : ''}
            ${address ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Address</td>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;">${address}</td></tr>` : ''}
            <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Service</td>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;">${service}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b;font-size:14px;vertical-align:top;">Project Details</td>
                <td style="padding:10px 0;color:#0f172a;font-size:14px;line-height:1.7;white-space:pre-wrap;">${body || '—'}</td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
            <p style="margin:0;color:#1d4ed8;font-size:13px;font-weight:600;">View in dashboard → <a href="https://schmidtportals.netlify.app/dashboard" style="color:#2563eb;">schmidtportals.netlify.app/dashboard</a></p>
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">Submitted via schmidtportals.netlify.app/quote</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // ── 3. Confirmation email to customer ────────────────────────
  const customerHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>We received your request</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0f172a;padding:28px 40px;">
          <p style="margin:0;color:#f59e0b;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Schmidt Construction</p>
          <p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">We got your request, ${name}!</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px;">Thanks for reaching out. We've received your quote request for <strong>${service}</strong> and will review the details shortly.</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 24px;">One of our team members will contact you within <strong>1 business day</strong> to discuss your project and schedule a free on-site estimate.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 8px;color:#15803d;font-weight:700;font-size:14px;">Your Project Summary</p>
            <p style="margin:0;color:#166534;font-size:13px;line-height:1.7;white-space:pre-wrap;">${body || `Service: ${service}`}</p>
          </div>
          <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px;">Can't wait? Give us a call:<br/>
            <a href="tel:+14023202600" style="color:#2563eb;font-weight:700;font-size:16px;">(402) 320-2600</a>
          </p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:22px 24px;text-align:center;">
            <p style="margin:0 0 6px;color:#1d4ed8;font-weight:700;font-size:15px;">Track your request in our Customer Portal</p>
            <p style="margin:0 0 16px;color:#475569;font-size:13px;line-height:1.6;">Create a password with this email address to follow your project's status, add remarks, and message our team directly.</p>
            <a href="https://schmidtportals.netlify.app/portal?email=${encodeURIComponent(email)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:8px;">View Customer Portal &rarr;</a>
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">Schmidt Construction · Omaha, NE · Family-owned since 1973</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const resend = getResend();

    const sends = [
      resend.emails.send({
        from: 'Schmidt Construction Portal <Mikiel@schmidt-construction.com>',
        to: ['matty@purepulse.one', 'mike@walls2.com', 'mikiel@schmidt-construction.com'],
        replyTo: email || undefined,
        subject: `⚡ New Quote Request — ${service} — ${name}`,
        html: adminHtml,
      }),
    ];

    if (email) {
      sends.push(
        resend.emails.send({
          from: 'Schmidt Construction <Mikiel@schmidt-construction.com>',
          to: email,
          subject: `We received your estimate request — Schmidt Construction`,
          html: customerHtml,
        })
      );
    }

    const results = await Promise.all(sends);
    const failed = results.find(r => r.error);
    if (failed?.error) {
      return NextResponse.json({ success: false, error: failed.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to send.' }, { status: 500 });
  }
}
