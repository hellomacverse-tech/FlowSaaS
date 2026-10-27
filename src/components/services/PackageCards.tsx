import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const packages = [
  {
    name: "Launch",
    price: "from $499",
    features: ["1 workflow", "1 integration set", "Staging + production", "30-day support"],
    popular: false,
  },
  {
    name: "Growth",
    price: "from $1,499",
    features: [
      "Up to 5 workflows",
      "Custom AI agent",
      "Monitoring dashboard",
      "Team training",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["Multi-team", "Private/on-prem deployment", "SSO", "SLA"],
    popular: false,
  },
];

const deployLogos = ["n8n Cloud", "AWS", "DigitalOcean", "Hetzner", "Google Cloud", "Azure", "On-premise Docker/Kubernetes"];

export function PackageCards() {
  return (
    <section id="packages" aria-labelledby="packages-heading" className="bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-caption text-center text-violet-600">PACKAGES</p>
        <h2 id="packages-heading" className="text-h2 mt-2 text-center text-ink">
          Fixed-Scope DFY Packages
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.name} className={`flex flex-col p-6 ${pkg.popular ? "ring-1 ring-violet-300" : ""}`}>
              {pkg.popular ? (
                <Badge tone="violet" className="mb-3 w-fit">
                  Most Popular
                </Badge>
              ) : null}
              <h3 className="text-[15px] font-semibold text-ink">{pkg.name}</h3>
              <p className="mt-1 text-2xl font-extrabold text-ink">{pkg.price}</p>
              <ul className="mt-4 flex flex-1 flex-col gap-2">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-ink-2">
                    <Check aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-teal-700" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild size="sm" variant={pkg.popular ? "primary" : "secondary-outline"} className="mt-5">
                <Link href="/services#quote">Request a Quote</Link>
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">What we deploy on</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-2">
            {deployLogos.map((logo) => (
              <span key={logo}>{logo}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
