import Link from "next/link";
import { heroMetrics } from "@/config/metrics";
import { Card } from "@/components/ui/Card";

export function MetricsBand() {
  return (
    <section id="metrics" aria-labelledby="metrics-heading" className="py-8 md:py-12">
      <h2 id="metrics-heading" className="sr-only">
        FlowSaaS impact metrics
      </h2>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="grid grid-cols-1 divide-y divide-line/70 p-8 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {heroMetrics.map((metric) => (
            <div key={metric.label} className="flex flex-col items-center gap-1 py-4 text-center sm:py-0">
              <p className="text-gradient font-display text-4xl font-extrabold">{metric.value}</p>
              <p className="text-sm text-muted">{metric.label}</p>
            </div>
          ))}
        </Card>
        <p className="mt-3 text-center text-xs text-muted">
          Aggregated from FlowSaaS-managed deployments and customer-reported results.{" "}
          <Link href="/security#metrics" className="underline hover:text-ink-2">
            Methodology →
          </Link>
        </p>
      </div>
    </section>
  );
}
