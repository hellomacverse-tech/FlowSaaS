import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Privacy Policy",
    description: "How FlowSaaS collects, uses, and protects your data, and the subprocessors we use.",
    path: "/privacy",
  });
}

const subprocessors = [
  { name: "Vercel", purpose: "Hosting & edge network" },
  { name: "Supabase", purpose: "Database, authentication, file storage" },
  { name: "Stripe", purpose: "Payments & billing" },
  { name: "Resend", purpose: "Transactional email" },
  { name: "PostHog", purpose: "Product analytics (consent-gated)" },
  { name: "Upstash", purpose: "Rate limiting" },
  { name: "Cloudflare", purpose: "Bot protection (Turnstile)" },
  { name: "OpenAI", purpose: "AI steps inside sandbox runs and select workflows" },
];

export default function PrivacyPage() {
  return (
    <section className="py-16 md:py-24">
      <div className="prose-measure mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-h2 text-ink">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: September 1, 2026</p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-2">
          <p>
            This policy explains what personal data FlowSaaS collects, why, and how you can control it. It
            applies to flowsaas.com, the FlowSaaS dashboard, and the Micro-SaaS tools.
          </p>

          <div>
            <h2 className="text-h3 text-ink">What we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Account data: name, email, company, and authentication identifiers.</li>
              <li>Billing data: handled by Stripe — FlowSaaS never stores full card numbers.</li>
              <li>
                Usage data: workflow downloads, tool runs, and sandbox inputs (sandbox inputs are
                automatically deleted after 30 days).
              </li>
              <li>
                Technical data: IP address (stored as a salted HMAC hash, never in plain text), browser
                type, and device information.
              </li>
              <li>Lead and booking data: name, email, company, and project details you submit through a form.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-h3 text-ink">How we use it</h2>
            <p className="mt-2">
              To provide the service (running your automations, processing payments, sending receipts and
              license keys), to respond to support and sales requests, to secure the platform against abuse,
              and — only with your consent — for product analytics.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">AI and your data</h2>
            <p className="mt-2">
              AI-generated outputs (in the sandbox and in workflows that call an LLM) may be inaccurate and
              should be reviewed before you rely on them. Sandbox inputs are redacted for obvious personal
              identifiers before reaching any LLM, and no customer data is used to train AI models.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">Subprocessors</h2>
            <p className="mt-2">We use the following subprocessors to run FlowSaaS:</p>
            <ul className="mt-2 divide-y divide-line/70 rounded-xl border border-line/70">
              {subprocessors.map((sub) => (
                <li key={sub.name} className="flex items-center justify-between px-4 py-2.5">
                  <span className="font-medium text-ink">{sub.name}</span>
                  <span className="text-xs text-muted">{sub.purpose}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-h3 text-ink">Your rights (GDPR / CCPA)</h2>
            <p className="mt-2">
              Wherever you&apos;re located, you can request a copy of your data or ask us to delete your account
              from the Billing page in your dashboard (&ldquo;Export my data&rdquo; / &ldquo;Delete
              account&rdquo;), or by emailing{" "}
              <a href={`mailto:${siteConfig.supportEmail}`} className="text-violet-600 hover:underline">
                {siteConfig.supportEmail}
              </a>
              . Enterprise customers can request a Data Processing Agreement.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">Contact</h2>
            <p className="mt-2">
              Questions about this policy? Email{" "}
              <a href={`mailto:${siteConfig.supportEmail}`} className="text-violet-600 hover:underline">
                {siteConfig.supportEmail}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
