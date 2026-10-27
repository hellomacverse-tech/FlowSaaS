import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Refund Policy",
    description: "Our 14-day refund policy for one-time template purchases, and how VIP cancellations work.",
    path: "/refunds",
  });
}

export default function RefundsPage() {
  return (
    <section className="py-16 md:py-24">
      <div className="prose-measure mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-h2 text-ink">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: September 1, 2026</p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-2">
          <div>
            <h2 className="text-h3 text-ink">One-time template purchases</h2>
            <p className="mt-2">
              If a workflow doesn&apos;t work as documented and our support team can&apos;t resolve it within a
              reasonable time, you can request a full refund within 14 days of purchase. Email{" "}
              <a href={`mailto:${siteConfig.supportEmail}`} className="text-violet-600 hover:underline">
                {siteConfig.supportEmail}
              </a>{" "}
              with your order number.
            </p>
            <p className="mt-2 font-medium text-ink">
              A refund revokes your entitlement to that workflow and invalidates future downloads. If you&apos;ve
              already downloaded the JSON file, we can&apos;t recall that copy — the refund covers the purchase,
              not removal of a file already on your machine.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">VIP Pass subscriptions</h2>
            <p className="mt-2">
              You can cancel anytime from the Billing page in your dashboard. Cancelling stops future
              billing; your access continues until the end of the current billing period. Because the VIP
              Pass includes a 7-day free trial, we don&apos;t offer refunds for the first billed period beyond
              that trial — cancel before the trial ends to avoid being charged.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">Micro-SaaS credits</h2>
            <p className="mt-2">
              Failed tool runs are never charged, so there&apos;s nothing to refund there. Purchased credit packs
              are non-refundable once credits have started being used, but unused packs can be refunded
              within 14 days of purchase.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-ink">Done-For-You projects</h2>
            <p className="mt-2">
              DFY refunds follow the milestone terms in your signed quote — generally, you&apos;re only billed for
              milestones already delivered.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
