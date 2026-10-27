import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { siteConfig } from "@/config/site";

const resend = new Resend(env.RESEND_API_KEY);
const FROM = `FlowSaaS <notifications@${new URL(siteConfig.url).hostname}>`;

function wrapper(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#F8FAFC;font-family:Inter,Helvetica,Arial,sans-serif;color:#0F172A;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">
            <tr>
              <td style="padding:32px;">
                <p style="font-weight:800;font-size:18px;margin:0 0 24px;">FlowSaaS</p>
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="font-size:12px;color:#64748B;margin-top:16px;">
            © ${new Date().getFullYear()} FlowSaaS. ${siteConfig.legalDisclaimer}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendQuoteConfirmationEmail(to: string, fullName: string) {
  const html = wrapper(`
    <h1 style="font-size:20px;margin:0 0 12px;">Thanks, ${escapeHtml(fullName)} — we've got your request</h1>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 12px;">
      We'll reply within 1 business day with next steps for your Done-For-You setup.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0;">
      In the meantime, feel free to browse the
      <a href="${siteConfig.url}/workflows" style="color:#7C3AED;">workflow catalog</a>.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: "We've received your FlowSaaS quote request",
    html,
  });
}

export async function sendInternalLeadNotification(params: {
  type: "dfy_quote" | "enterprise" | "contact";
  fullName: string;
  email: string;
  company: string;
  summary: string;
}) {
  const html = wrapper(`
    <h1 style="font-size:20px;margin:0 0 12px;">New ${escapeHtml(params.type)} lead</h1>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 6px;"><strong>${escapeHtml(params.fullName)}</strong> — ${escapeHtml(params.company)}</p>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 12px;">${escapeHtml(params.email)}</p>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0;white-space:pre-wrap;">${escapeHtml(params.summary)}</p>
  `);

  return resend.emails.send({
    from: FROM,
    to: siteConfig.supportEmail,
    subject: `New lead: ${params.company}`,
    html,
  });
}

export async function sendBookingConfirmationEmail(
  to: string,
  fullName: string,
  details: { dateLabel: string; timezone: string },
) {
  const html = wrapper(`
    <h1 style="font-size:20px;margin:0 0 12px;">You're booked, ${escapeHtml(fullName)}</h1>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 6px;">
      45-min Discovery Call · Google Meet
    </p>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 12px;">
      ${escapeHtml(details.dateLabel)} (${escapeHtml(details.timezone)})
    </p>
    <p style="font-size:13px;color:#64748B;margin:0;">
      You'll get a reminder 24 hours and 1 hour before the call.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: "Your FlowSaaS Discovery Call is confirmed",
    html,
  });
}

export async function sendPurchaseReceiptEmail(
  to: string,
  details: { workflowTitle: string; amountCents: number; currency: string; licenseKey: string },
) {
  const amount = (details.amountCents / 100).toFixed(2);
  const html = wrapper(`
    <h1 style="font-size:20px;margin:0 0 12px;">Your ${escapeHtml(details.workflowTitle)} receipt</h1>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 12px;">
      Charged ${escapeHtml(details.currency)} ${amount}. Your workflow is ready to download from your
      <a href="${siteConfig.url}/app/library" style="color:#7C3AED;">library</a>.
    </p>
    <p style="font-size:13px;color:#64748B;margin:0 0 4px;">Your FlowSaaS license key:</p>
    <p style="font-family:monospace;font-size:14px;background:#F1F5F9;padding:10px 12px;border-radius:8px;margin:0;">
      ${escapeHtml(details.licenseKey)}
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your receipt: ${details.workflowTitle}`,
    html,
  });
}

export async function sendVipWelcomeEmail(to: string) {
  const html = wrapper(`
    <h1 style="font-size:20px;margin:0 0 12px;">Welcome to the VIP Pass</h1>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 12px;">
      Your 7-day free trial has started. You now have unlimited workflow downloads, 2,000 Micro-SaaS
      credits/month, and priority support.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0;">
      <a href="${siteConfig.url}/workflows" style="color:#7C3AED;">Browse the full catalog</a> — every
      workflow is included.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to FlowSaaS VIP",
    html,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
