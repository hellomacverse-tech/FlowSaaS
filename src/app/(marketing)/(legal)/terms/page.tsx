import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Terms of Service",
    description: "The terms that govern your use of FlowSaaS templates, subscriptions, and services.",
    path: "/terms",
  });
}

export default function TermsPage() {
  return (
    <section className="py-16 md:py-24">
      <div className="prose-measure mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-h2 text-ink">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted">Last updated: September 1, 2026</p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-2">
          <p>
            By purchasing a workflow, subscribing to the VIP Pass, booking a Done-For-You engagement, or
            using a Micro-SaaS tool, you agree to these terms.
          </p>

          <div>
            <h2 className="text-h3 text-ink">1. Templates and licensing</h2>
            <p className="mt-2">
              A one-time template purchase grants you a perpetual, non-exclusive license to use, modify, and
              deploy that workflow&apos;s JSON in your own n8n instance(s). You may not resell, redistribute, or
              relicense the JSON file itself.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">2. VIP Pass subscription</h2>
            <p className="mt-2">
              The VIP Pass is billed monthly or annually and can be cancelled at any time; access continues
              until the end of the current billing period. Workflows downloaded while subscribed remain
              usable after cancellation, but you stop receiving new workflows and updates.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">3. Done-For-You engagements</h2>
            <p className="mt-2">
              DFY projects are governed by the fixed-scope quote and milestone terms you accept before work
              begins. You own everything built for you and delivered to your infrastructure.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">4. Micro-SaaS tools and credits</h2>
            <p className="mt-2">
              Credits are consumed only on successful tool runs; a failed run is not charged. Credits reset
              monthly and do not roll over; credit packs purchased separately never expire.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">5. Acceptable use</h2>
            <p className="mt-2">
              You&apos;re responsible for having the right to connect any third-party account (Facebook, Google,
              Shopify, etc.) to a FlowSaaS workflow, and for complying with that platform&apos;s own terms —
              including Meta&apos;s Platform Terms for any Messenger automation.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">6. Disclaimers</h2>
            <p className="mt-2">
              Workflows and AI-generated outputs are provided &ldquo;as is.&rdquo; FlowSaaS is not liable for indirect or
              consequential damages arising from your use of a workflow, to the maximum extent permitted by
              law.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">7. Changes to these terms</h2>
            <p className="mt-2">
              We&apos;ll post updates here and, for material changes, notify active subscribers by email at least
              14 days before they take effect.
            </p>
          </div>

          <p>
            See also our{" "}
            <Link href="/refunds" className="text-violet-600 hover:underline">
              Refund Policy
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-violet-600 hover:underline">
              Privacy Policy
            </Link>
            . Questions? Email{" "}
            <a href={`mailto:${siteConfig.supportEmail}`} className="text-violet-600 hover:underline">
              {siteConfig.supportEmail}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
