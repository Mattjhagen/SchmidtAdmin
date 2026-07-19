import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export interface SendProposalEmailParams {
  to: string;
  clientName: string;
  proposalNumber: string;
  projectName: string;
  portalUrl: string;
  total: number;
  expirationDate?: string;
}

export async function sendProposalEmail({
  to,
  clientName,
  proposalNumber,
  projectName,
  portalUrl,
  total,
  expirationDate,
}: SendProposalEmailParams) {
  const formattedTotal = total.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const expirationLine = expirationDate
    ? `<tr>
        <td style="padding:4px 0;color:#64748b;font-size:14px;">Proposal Expires:</td>
        <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${new Date(expirationDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td>
       </tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Schmidt Construction Proposal</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

          <!-- Header Banner -->
          <tr>
            <td style="background-color:#0f172a;padding:28px 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="${siteUrl}/logo.png" width="200" alt="Schmidt Construction Inc." style="display:block;border:0;max-width:200px;height:auto;" />
                  </td>
                  <td align="right" style="padding-left:16px;vertical-align:middle;">
                    <div style="background-color:#1d4ed8;color:#ffffff;font-size:11px;font-weight:800;padding:6px 14px;border-radius:20px;white-space:nowrap;letter-spacing:0.05em;">
                      ${proposalNumber}
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;color:#ffffff;font-size:20px;font-weight:700;line-height:1.3;">Your Proposal Is Ready</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
                Hello <strong style="color:#0f172a;">${clientName}</strong>,
              </p>
              <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.7;">
                Thank you for the opportunity to work on your project. We have prepared a detailed proposal for <strong style="color:#0f172a;">${projectName}</strong> and it is ready for your review in our secure client portal.
              </p>

              <!-- Proposal Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Proposal Summary</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;color:#64748b;font-size:14px;padding-right:32px;">Project:</td>
                        <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${projectName}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#64748b;font-size:14px;padding-right:32px;">Proposal #:</td>
                        <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${proposalNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#64748b;font-size:14px;padding-right:32px;">Estimate Total:</td>
                        <td style="padding:4px 0;color:#0f172a;font-size:18px;font-weight:800;">${formattedTotal}</td>
                      </tr>
                      ${expirationLine}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}"
                       style="display:inline-block;background-color:#1d4ed8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 40px;border-radius:8px;letter-spacing:0.02em;">
                      View &amp; Accept Your Proposal →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.7;">
                In the portal you can review the full line-item cost breakdown, select any optional upgrades, and authorize the contract with a secure digital signature — all from any device.
              </p>
              <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">
                If you have questions or would like to request any changes, simply reply to this email or leave a comment directly in the portal feedback panel.
              </p>

              <p style="margin:0;color:#475569;font-size:14px;line-height:1.7;">
                Thank you for choosing Schmidt Construction.<br />
                We look forward to working with you.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;color:#0f172a;font-size:13px;font-weight:700;">Schmidt Construction</p>
                    <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Omaha, Nebraska · office@schmidtconstruction.com</p>
                  </td>
                  <td align="right">
                    <p style="margin:0;color:#cbd5e1;font-size:11px;">Retaining Walls · Concrete · Drainage<br />Kitchen &amp; Bath Remodels</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <p style="margin:20px 0 0;color:#94a3b8;font-size:11px;text-align:center;">
          This email was sent from Schmidt Construction's estimating system.<br />
          If you did not request this proposal, please disregard this message.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const replyTo = process.env.PROPOSAL_REPLY_TO;
  const overrideTo = process.env.EMAIL_OVERRIDE_TO?.trim();
  const recipient = overrideTo || to;

  const subject = overrideTo
    ? `[EMAIL OVERRIDE] Your Proposal ${proposalNumber} Is Ready — Schmidt Construction`
    : `Your Proposal ${proposalNumber} Is Ready — Schmidt Construction`;

  const overrideBanner = overrideTo
    ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr>
      <td style="background-color:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#713f12;">⚠ Development Override</p>
        <p style="margin:0 0 4px;font-size:13px;color:#854d0e;line-height:1.5;">
          This email was originally intended for:
        </p>
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#713f12;font-family:monospace;">${to}</p>
        <p style="margin:0;font-size:12px;color:#a16207;">
          It has been redirected because <code style="background:#fef08a;padding:1px 4px;border-radius:3px;">EMAIL_OVERRIDE_TO</code> is enabled.
        </p>
      </td>
    </tr>
  </table>`
    : "";

  // Insert the override banner immediately after the opening body <td> padding cell
  const htmlWithBanner = overrideBanner
    ? html.replace(
        /(<td style="padding:36px 40px;">)/,
        `$1\n${overrideBanner}`
      )
    : html;

  return await getResend().emails.send({
    from:
      process.env.PROPOSAL_FROM_EMAIL ??
      "Schmidt Construction <Mikiel@schmidt-construction.com>",
    to: recipient,
    subject,
    html: htmlWithBanner,
    ...(replyTo ? { replyTo } : {}),
  });
}

export async function sendTimesheetEmail(submission: import('./types').TimesheetSubmission) {
  const settings = submission.contractor_settings_snapshot;
  const totals = submission.totals_snapshot;
  const managerEmail = settings.manager_email;

  if (!managerEmail) {
    throw new Error('Manager email not configured for this contractor.');
  }

  const html = `
    <h1>Timesheet Submission - ${settings.contractor_name}</h1>
    <p><strong>Period:</strong> ${submission.period_start} to ${submission.period_end}</p>
    <p><strong>Submitted At:</strong> ${new Date(submission.submitted_at).toLocaleString()}</p>
    
    <h3>Totals</h3>
    <ul>
      <li>Regular Hours: ${totals.regular_hours || 0}</li>
      <li>Additional Hours: ${totals.additional_hours || 0}</li>
      <li>Gross Earnings: $${((totals.gross_earnings || 0) / 100).toFixed(2)}</li>
    </ul>

    <p style="font-size: 12px; color: #666; font-style: italic;">
      Disclaimer: Earnings shown are gross 1099 contractor earnings before taxes, business expenses, or other deductions. No federal, state, or local taxes are calculated or withheld by this application.
    </p>
  `;

  try {
    const data = await getResend().emails.send({
      from: 'SchmidtAdmin TimeClock <noreply@schmidt-construction.com>',
      to: [managerEmail],
      subject: `Timesheet: ${settings.contractor_name} (${submission.period_start} - ${submission.period_end})`,
      html,
    });
    
    return data;
  } catch (error) {
    console.error('Failed to send Resend email', error);
    throw error;
  }
}

export interface ReportEmailParams {
  contractorName: string;
  companyName: string;
  managerEmail: string;
  dateOrWeekRange: string;
  isWeekly: boolean;
  totalHours: string;
  grossEarnings: string;
  shifts: {
    date: string;
    project: string;
    clockIn: string;
    clockOut: string;
    duration: string;
    breaks: string;
    earnings: string;
    notes: string;
  }[];
  projectBreakdown: {
    project: string;
    hours: string;
    earnings: string;
  }[];
}

export async function sendTimeClockReportEmail(params: ReportEmailParams) {
  const managerEmail = params.managerEmail;
  if (!managerEmail) {
    throw new Error('Manager email is not configured.');
  }

  const shiftsRows = params.shifts.map(s => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${s.date}<br/><span style="font-size:11px;color:#64748b;">${s.clockIn} - ${s.clockOut}</span></td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;font-weight:600;">${s.project}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;text-align:center;">${s.breaks}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;font-weight:600;text-align:right;">${s.duration} hrs</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:700;text-align:right;">${s.earnings}</td>
    </tr>
  `).join('');

  const projectRows = params.projectBreakdown.map(p => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569;font-weight:600;">${p.project}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569;text-align:right;">${p.hours} hrs</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:700;text-align:right;">${p.earnings}</td>
    </tr>
  `).join('');

  const reportType = params.isWeekly ? "Weekly Contractor Report" : "Daily Contractor Report";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${reportType}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="650" cellpadding="0" cellspacing="0" style="max-width:650px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px -10px rgba(15,23,42,0.15);border:1px solid #e2e8f0;">
          
          <!-- Top Accent Line -->
          <tr>
            <td height="4" style="background-color:#206BD4;line-height:4px;font-size:4px;">&nbsp;</td>
          </tr>

          <!-- walls2.com Inspired Premium Letterhead Header -->
          <tr>
            <td style="background-color:#0f172a;padding:32px 40px;color:#ffffff;border-bottom:3px solid #206BD4;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Schmidt Monogram / Typography Brand -->
                    <div style="font-size:22px;font-weight:900;letter-spacing:-0.03em;color:#ffffff;">
                      SCHMIDT <span style="color:#206BD4;">CONSTRUCTION</span>
                    </div>
                    <div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.05em;margin-top:4px;text-transform:uppercase;">
                      Omaha's Retaining Wall & Concrete Experts Since 1973
                    </div>
                  </td>
                  <td align="right" style="vertical-align:top;color:#64748b;font-size:11px;line-height:1.6;font-weight:500;">
                    <div>Office: (402) 320-2600</div>
                    <div>mikiel@schmidt-construction.com</div>
                    <div><a href="https://www.walls2.com" style="color:#206BD4;text-decoration:none;font-weight:700;">www.walls2.com</a></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td>
                    <h2 style="margin:0;font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${reportType}</h2>
                    <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Report Period: <strong>${params.dateOrWeekRange}</strong></p>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="background-color:#EAF2FE;color:#206BD4;font-size:11px;font-weight:800;padding:6px 14px;border-radius:20px;border:1px solid #BFDBFE;text-transform:uppercase;letter-spacing:0.05em;">
                      1099 Contractor
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Contractor Info Summary Block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:32px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="vertical-align:top;">
                          <div style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Contractor Details</div>
                          <div style="font-size:14px;font-weight:700;color:#0f172a;">${params.contractorName}</div>
                          <div style="font-size:13px;color:#475569;margin-top:2px;">${params.companyName || 'Independent Contractor'}</div>
                        </td>
                        <td width="50%" style="vertical-align:top;border-left:1px solid #e2e8f0;padding-left:24px;">
                          <div style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Earnings Summary</div>
                          <div style="font-size:18px;font-weight:800;color:#0f172a;">${params.grossEarnings}</div>
                          <div style="font-size:13px;color:#475569;margin-top:2px;">Total Hours: <strong>${params.totalHours} hrs</strong></div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Project Breakdown Section -->
              <h3 style="font-size:14px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Project Breakdown</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:32px;">
                <thead style="background-color:#f8fafc;">
                  <tr>
                    <th align="left" style="padding:10px 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Project</th>
                    <th align="right" style="padding:10px 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Hours</th>
                    <th align="right" style="padding:10px 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  ${projectRows}
                </tbody>
              </table>

              <!-- Detailed Shifts Section -->
              <h3 style="font-size:14px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Detailed Time Entries</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                <thead style="background-color:#f8fafc;">
                  <tr>
                    <th align="left" style="padding:10px 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Date & Time</th>
                    <th align="left" style="padding:10px 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Project</th>
                    <th align="center" style="padding:10px 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Breaks</th>
                    <th align="right" style="padding:10px 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Duration</th>
                    <th align="right" style="padding:10px 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  ${shiftsRows}
                </tbody>
              </table>

              <!-- Signature Section -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:28px;">
                <tr>
                  <td width="45%" style="vertical-align:bottom;">
                    <div style="border-bottom:1px solid #94a3b8;height:24px;margin-bottom:6px;"></div>
                    <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Contractor Signature</div>
                  </td>
                  <td width="10%">&nbsp;</td>
                  <td width="45%" style="vertical-align:bottom;">
                    <div style="border-bottom:1px solid #94a3b8;height:24px;margin-bottom:6px;"></div>
                    <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Manager Approval Signature</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer with 1099 legal tax disclaimer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#64748b;font-size:11px;line-height:1.6;font-style:italic;">
                <strong>Disclaimer:</strong> This statement details gross earnings as an independent 1099 contractor for Schmidt Construction. No federal, state, or local taxes have been calculated or withheld. The contractor is solely responsible for all tax self-employment obligations.
              </p>
              <p style="margin:12px 0 0;color:#cbd5e1;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;">
                Schmidt Construction © ${new Date().getFullYear()} · All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const overrideTo = process.env.EMAIL_OVERRIDE_TO?.trim();
  const recipient = overrideTo || managerEmail;

  return await getResend().emails.send({
    from: 'Schmidt Construction TimeClock <mikiel@schmidt-construction.com>',
    to: recipient,
    subject: `${reportType}: ${params.contractorName} (${params.dateOrWeekRange})`,
    html,
  });
}

