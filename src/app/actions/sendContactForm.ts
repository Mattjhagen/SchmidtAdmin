'use server';

import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendContactForm(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const name = (formData.get('name') as string | null)?.trim() || '';
  const phone = (formData.get('phone') as string | null)?.trim() || '';
  const service = (formData.get('service') as string | null)?.trim() || '';
  const message = (formData.get('body') as string | null)?.trim() || '';

  if (!name) return { success: false, error: 'Name is required.' };

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>New Estimate Request</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0f172a;padding:28px 40px;">
          <p style="margin:0;color:#f59e0b;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">New Estimate Request</p>
          <p style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;">Schmidt Construction Website</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:140px;">Name</td>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Phone</td>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;">${phone || '—'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Service</td>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;">${service || '—'}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b;font-size:14px;vertical-align:top;">Message</td>
                <td style="padding:10px 0;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message || '—'}</td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">Submitted via schmidt-construction.com contact form</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const { error } = await getResend().emails.send({
      from: 'Schmidt Construction Website <Mikiel@schmidt-construction.com>',
      to: 'mikiel@schmidt-construction.com',
      replyTo: phone ? undefined : undefined,
      subject: `New Estimate Request from ${name}${service ? ` — ${service}` : ''}`,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send message.' };
  }
}
