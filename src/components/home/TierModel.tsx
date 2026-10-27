import Link from "next/link";
import { Store, Crown, Wrench, Zap, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const tiers = [
  {
    icon: Store,
    tone: "teal" as const,
    title: "Digital Template Store",
    promise: "One-time purchase. Instant JSON export & video setup guide.",
    bullets: ["Own the workflow forever", "Import-ready n8n JSON", "Step-by-step video walkthrough"],
    price: "From $35 one-time",
    cta: { label: "Browse Templates", href: "/workflows" as const },
    popular: false,
  },
  {
    icon: Crown,
    tone: "violet" as const,
    title: "FlowSaaS All-Access VIP Pass",
    promise: "Monthly/Annual subscription for unlimited workflow downloads & updates.",
    bullets: ["Every workflow, every update", "2,000 Micro-SaaS credits / month", "Priority support"],
    price: "$29/mo · or $290/yr",
    cta: { label: "Start 7-Day Free Trial", href: "/pricing#vip" as const },
    popular: true,
  },
  {
    icon: Wrench,
    tone: "coral" as const,
    title: "Done-For-You (DFY) Managed Setup",
    promise: "Dedicated engineering team deploys workflows directly to client servers with 30-day support.",
    bullets: [
      "Discovery, build & security testing",
      "Deployed on your infrastructure",
      "30 days of post-launch support",
    ],
    price: "From $499 per workflow",
    cta: { label: "Book a Setup Call", href: "/services#book" as const },
    popular: false,
  },
  {
    icon: Zap,
    tone: "teal" as const,
    title: "Micro-SaaS On-Demand Tools",
    promise: "Run workflows directly from our browser dashboard using input forms without touching n8n.",
    bullets: ["No servers, no n8n needed", "Pay with credits, only for successful runs", "API access for developers"],
    price: "50 free credits / month",
    cta: { label: "Try Tools Free", href: "/tools" as const },
    popular: false,
  },
];

const iconTone = {
  teal: "bg-teal-50 text-teal-700",
  violet: "bg-violet-50 text-violet-600",
  coral: "bg-coral-50 text-coral-700",
};

export function TierModel() {
  return (
    <section id="models" aria-labelledby="models-heading" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-caption text-violet-600">HOW YOU CAN USE FLOWSAAS</p>
        <h2 id="models-heading" className="text-h2 mt-2 max-w-2xl text-ink">
          Four Ways to Put Automation to Work
        </h2>
        <p className="prose-measure mt-3 text-ink-2">
          Start with a single template, go all-access, hand it to our engineers, or skip n8n entirely.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.title}
                className={`flex flex-col p-6 ${tier.popular ? "ring-1 ring-violet-300" : ""}`}
              >
                {tier.popular ? (
                  <Badge tone="violet" className="mb-3 w-fit">
                    Most Popular
                  </Badge>
                ) : null}
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconTone[tier.tone]}`}>
                  <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-ink">{tier.title}</h3>
                <p className="mt-1.5 text-sm text-ink-2">{tier.promise}</p>
                <ul className="mt-4 flex flex-col gap-2">
                  {tier.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm text-ink-2">
                      <Check aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-teal-700" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm font-semibold text-ink">{tier.price}</p>
                <Link
                  href={tier.cta.href}
                  className="mt-4 text-sm font-medium text-violet-600 hover:underline"
                >
                  {tier.cta.label} →
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
