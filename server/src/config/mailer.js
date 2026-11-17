const nodemailer = require('nodemailer');

let transporter = null;
const emailLogs = []; // In-memory log of dispatched emails for testing & demo audit

const initMailer = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`[Email] Nodemailer configured with SMTP host: ${process.env.SMTP_HOST}`);
  } else {
    // Generate Ethereal test account or fallback logger
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Email] Nodemailer initialized with Ethereal test account: ${testAccount.user}`);
    } catch (e) {
      // Fallback dummy transport
      transporter = {
        sendMail: async (options) => {
          console.log(`[Email Simulation] To: ${options.to} | Subject: ${options.subject}`);
          return { messageId: `mock-${Date.now()}` };
        },
      };
      console.log('[Email] Nodemailer operating in simulation logger mode');
    }
  }
};

/**
 * Send corporate grievance notification when a new complaint is filed
 */
const sendComplaintFiledEmail = async ({ brand, branch, complaint, user, resolveUrl }) => {
  if (!transporter) await initMailer();

  const toEmail = brand.escalationEmail || 'escalations@franchise-corp.com';
  const subject = `[URGENT ESCALATION] Ticket #${complaint.ticketId}: ${complaint.category} at ${branch.branchName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }
        .card { background: #1e293b; border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #334155; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; }
        .badge-gps { background: #064e3b; color: #34d399; }
        .badge-cat { background: #881337; color: #fda4af; }
        .cta-btn { display: inline-block; background: #e11d48; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
        .sla-warning { background: #451a03; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; border-radius: 4px; color: #fde68a; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2 style="color: #f43f5e; margin-top: 0;">EscalateHQ — Official Corporate Grievance Notice</h2>
        <p>This automated escalation has been dispatched to <strong>${brand.name}</strong> Corporate Grievance Directorate.</p>

        <div style="margin: 16px 0; border-top: 1px solid #334155; border-bottom: 1px solid #334155; padding: 12px 0;">
          <p><strong>Ticket ID:</strong> ${complaint.ticketId}</p>
          <p><strong>Category:</strong> <span class="badge badge-cat">${complaint.category}</span></p>
          <p><strong>Branch Location:</strong> ${branch.branchName} (${branch.city}, ${branch.state || ''})</p>
          <p><strong>GPS Verification:</strong> ${complaint.isGpsVerified ? '<span class="badge badge-gps">✓ Verified On-Premises via Geolocation</span>' : '<span style="color:#94a3b8">Unverified Coords</span>'}</p>
          <p><strong>Customer:</strong> ${user.name} (${user.email})</p>
        </div>

        <h3>Incident Narrative:</h3>
        <p style="background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #334155;">
          "${complaint.description}"
        </p>

        ${complaint.evidenceUrls && complaint.evidenceUrls.length > 0 ? `
          <h3>Submitted Proof / Receipts (${complaint.evidenceUrls.length} file(s)):</h3>
          <ul>
            ${complaint.evidenceUrls.map(url => `<li><a href="${url}" style="color: #38bdf8;" target="_blank">View Evidence File</a></li>`).join('')}
          </ul>
        ` : ''}

        <div class="sla-warning">
          <strong>⏱ 48-Hour Corporate SLA Active:</strong><br/>
          If this grievance is not acknowledged and resolved within 48 hours, EscalateHQ will automatically mark this ticket as <strong>ESCALATED (SLA BREACHED)</strong> on the public transparency scorecard.
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${resolveUrl}" class="cta-btn">Review & Mark Resolved in EscalateHQ</a>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"EscalateHQ Corporate Grievance Desk" <${process.env.FROM_EMAIL || 'grievance@escalatehq.org'}>`,
      to: toEmail,
      subject,
      html,
    });

    let previewUrl = null;
    if (nodemailer.getTestMessageUrl && info) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Email] Ethereal Preview URL: ${previewUrl}`);
      }
    }

    emailLogs.unshift({
      id: info.messageId || `msg-${Date.now()}`,
      to: toEmail,
      subject,
      ticketId: complaint.ticketId,
      sentAt: new Date(),
      previewUrl,
    });

    return info;
  } catch (err) {
    console.error(`[Email Error] Failed to send complaint filed email: ${err.message}`);
  }
};

/**
 * Send auto-escalation alert when 48 hours SLA has passed
 */
const sendEscalationAlertEmail = async ({ brand, branch, complaint, resolveUrl }) => {
  if (!transporter) await initMailer();

  const toEmail = brand.escalationEmail || 'escalations@franchise-corp.com';
  const subject = `[SLA BREACH ALERT] Ticket #${complaint.ticketId} Auto-Escalated to Executive Directorate`;

  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px;">
      <div style="background: #1e293b; border-radius: 10px; padding: 24px; max-width: 600px; margin: 0 auto; border-top: 4px solid #ef4444;">
        <h2 style="color: #ef4444;">⚠️ 48-Hour SLA Breach Escalation</h2>
        <p>Ticket <strong>#${complaint.ticketId}</strong> for branch <strong>${branch.branchName}</strong> has remained unresolved for more than 48 hours.</p>
        <p>In accordance with transparency protocols, this grievance has been automatically upgraded to <strong>ESCALATED</strong> status on the public brand ledger.</p>
        <p><strong>Category:</strong> ${complaint.category}</p>
        <p><strong>Description:</strong> ${complaint.description}</p>
        <p><a href="${resolveUrl}" style="background: #ef4444; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 10px;">Resolve Now</a></p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"EscalateHQ SLA Monitor" <${process.env.FROM_EMAIL || 'grievance@escalatehq.org'}>`,
      to: toEmail,
      subject,
      html,
    });
    return info;
  } catch (err) {
    console.error(`[Email Error] Failed to send escalation alert: ${err.message}`);
  }
};

module.exports = {
  initMailer,
  sendComplaintFiledEmail,
  sendEscalationAlertEmail,
  getEmailLogs: () => emailLogs,
};
