import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { heroMetrics } from "@/config/metrics";
import { siteConfig } from "@/config/site";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Security",
    description: "How FlowSaaS encrypts credentials, isolates the sandbox, and handles incident response.",
    path: "/security",
  });
}

export default function SecurityPage() {
  return (
    <section className="py-16 md:py-24">
      <div className="prose-measure mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-h2 text-ink">Security</h1>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-2">
          <div>
            <h2 className="text-h3 text-ink">Encryption</h2>
            <p className="mt-2">
              Data is encrypted in transit (TLS 1.2+) and at rest. Your own n8n instance&apos;s API key, when you
              connect one for &ldquo;Deploy to My n8n Instance,&rdquo; is encrypted with AES-256-GCM before it&apos;s stored —
              we never return it to the browser afterward, only a masked last-4.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">Sandbox isolation</h2>
            <p className="mt-2">
              The Live Sandbox runs against sample data only. It never calls your real Facebook, Google
              Sheets, or Shopify accounts — outputs shown there are simulated, and the interface says so.
              Sandbox inputs are automatically deleted after 30 days.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">Access control</h2>
            <p className="mt-2">
              Every database table uses Row Level Security: a user can only read their own orders,
              subscriptions, entitlements, downloads, and tool runs. Writes to those tables happen only
              through server-side code using a service-role key that&apos;s never exposed to the browser.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">SSRF protection</h2>
            <p className="mt-2">
              When you connect your own n8n instance, we validate the URL is HTTPS, resolve its DNS, and
              reject private, loopback, and link-local IP ranges before ever making a request to it.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">Backups & incident response</h2>
            <p className="mt-2">
              The database runs with point-in-time recovery enabled. If we discover an incident affecting
              customer data, we notify affected accounts and, where required by law, relevant authorities,
              without undue delay.
            </p>
          </div>

          <div id="metrics">
            <h2 className="text-h3 text-ink">Methodology for headline metrics</h2>
            <p className="mt-2">
              The figures on our homepage are recalculated periodically, not invented for marketing copy:
            </p>
            <ul className="mt-2 flex flex-col gap-3">
              {heroMetrics.map((metric) => (
                <li key={metric.label} className="rounded-xl border border-line/70 p-3">
                  <p className="font-medium text-ink">
                    {metric.value} — {metric.label}
                  </p>
                  <p className="mt-1 text-xs text-muted">{metric.substantiation}</p>
                  <p className="mt-1 text-xs text-muted">Last verified: {metric.lastVerifiedAt}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-h3 text-ink">Report a vulnerability</h2>
            <p className="mt-2">
              Email{" "}
              <a href={`mailto:${siteConfig.supportEmail}`} className="text-violet-600 hover:underline">
                {siteConfig.supportEmail}
              </a>{" "}
              with details — we credit and respond to good-faith reports.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
