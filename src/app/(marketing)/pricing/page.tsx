import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbNode, buildOrganizationNode } from "@/lib/schema/organization";
import { siteConfig } from "@/config/site";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { pricingFaqs } from "@/data/pricing-faqs";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Pricing",
    description:
      "Simple pricing for every way you automate — templates, the VIP Pass, Done-For-You, and Micro-SaaS credits.",
    path: "/pricing",
  });
}

const tiers = [
  {
    name: "Templates",
    price: "from $35",
    period: "one-time",
    cta: { label: "Browse Templates", href: "/workflows" as const },
    popular: false,
  },
  {
    name: "VIP Pass",
    price: "$29",
    period: "/mo ($290/yr)",
    cta: { label: "Start 7-Day Free Trial", href: "/signup" as const },
    popular: true,
  },
  {
    name: "Done-For-You",
    price: "from $499",
    period: "per project",
    cta: { label: "Request a Quote", href: "/services#quote" as const },
    popular: false,
  },
  {
    name: "Micro-SaaS",
    price: "Free",
    period: "50 credits, then 5,000 for $19",
    cta: { label: "Try Tools Free", href: "/tools" as const },
    popular: false,
  },
];

type CompareValue = boolean | string;
const compareRows: { label: string; values: [CompareValue, CompareValue, CompareValue, CompareValue] }[] = [
  { label: "Workflow downloads", values: ["Purchased only", "Unlimited", "Delivered to your infra", "—"] },
  { label: "Updates", values: ["12 months", "While subscribed", "30-day support window", "—"] },
  { label: "Video guides", values: [true, true, true, "—"] },
  { label: "Credits / month", values: ["—", "2,000", "—", "50 (free)"] },
  { label: "API access", values: [false, true, "—", true] },
  { label: "Priority support", values: [false, true, true, false] },
  { label: "DFY discount", values: ["—", "10% off", "—", "—"] },
  { label: "SSO", values: [false, false, "Enterprise only", false] },
];

function CompareCell({ value }: { value: CompareValue }) {
  if (value === true) return <Check aria-hidden="true" size={16} className="mx-auto text-teal-700" />;
  if (value === false) return <X aria-hidden="true" size={16} className="mx-auto text-muted" />;
  return <span className="text-sm text-ink-2">{value}</span>;
}

export default function PricingPage() {
  const pageUrl = `${siteConfig.url}/pricing`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildOrganizationNode(),
            buildBreadcrumbNode(pageUrl, [{ name: "Home", item: siteConfig.url }, { name: "Pricing" }]),
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}#faq`,
              mainEntity: pricingFaqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answerPlain },
              })),
            },
          ],
        }}
      />

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-h1 text-center text-ink">Simple Pricing for Every Way You Automate</h1>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {tiers.map((tier) => (
              <Card key={tier.name} className={`flex flex-col p-6 ${tier.popular ? "ring-1 ring-violet-300" : ""}`}>
                {tier.popular ? (
                  <Badge tone="violet" className="mb-3 w-fit">
                    Most Popular
                  </Badge>
                ) : null}
                <h2 className="text-[15px] font-semibold text-ink">{tier.name}</h2>
                <p className="mt-2 text-3xl font-extrabold text-ink">{tier.price}</p>
                <p className="text-sm text-muted">{tier.period}</p>
                <Button asChild size="sm" variant={tier.popular ? "primary" : "secondary-outline"} className="mt-5">
                  <Link href={tier.cta.href}>{tier.cta.label}</Link>
                </Button>
              </Card>
            ))}
          </div>

          <div id="vip" className="mt-16 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-center">
              <thead>
                <tr className="border-b border-line/70">
                  <th className="sticky left-0 bg-canvas py-3 text-left text-sm font-semibold text-ink">
                    Feature
                  </th>
                  {tiers.map((tier) => (
                    <th key={tier.name} className="py-3 text-sm font-semibold text-ink">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.label} className="border-b border-line/70">
                    <td className="sticky left-0 bg-canvas py-3 text-left text-sm text-ink-2">{row.label}</td>
                    {row.values.map((value, i) => (
                      <td key={i} className="py-3">
                        <CompareCell value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card className="mx-auto mt-12 max-w-2xl p-6 text-center">
            <p className="text-sm font-semibold text-ink">14-day money-back guarantee</p>
            <p className="mt-1.5 text-sm text-ink-2">
              One-time template purchases can be refunded within 14 days if a workflow doesn&apos;t work as
              documented and our support team can&apos;t resolve it. See the{" "}
              <Link href="/refunds" className="text-violet-600 hover:underline">
                full refund policy
              </Link>
              .
            </p>
          </Card>

          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-h2 text-center text-ink">Pricing FAQ</h2>
            <div className="mt-8">
              <Accordion
                items={pricingFaqs.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answerPlain }))}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
