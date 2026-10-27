import Link from "next/link";
import { Zap, Check } from "lucide-react";
import { GradientSpheres } from "@/components/layout/GradientSpheres";
import { Button } from "@/components/ui/Button";
import { HeroFlowVisual } from "./HeroFlowVisual";

const microCopy = ["No credit card required", "Instant JSON export", "14-day refund on templates"];

/**
 * `catalogCountLabel` must come from a live count of published workflows
 * once the catalog exists (Phase 3) — "100+" may only render once that
 * count actually reaches 100 (Section 16, rule 1). Hard-coded to the
 * current seed catalog size until then.
 */
function getCatalogCountLabel(count: number): string {
  return count >= 100 ? "100+" : String(count);
}

export function Hero() {
  const catalogCountLabel = getCatalogCountLabel(12);

  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative overflow-hidden py-16 md:py-24">
      <GradientSpheres variant="hero" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-2 shadow-xs">
            <Zap aria-hidden="true" size={16} className="text-teal-500" />
            Powered by n8n &amp; Autonomous AI Agents
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
            </span>
          </span>

          <h1 id="hero-heading" className="text-h1 mt-6 max-w-2xl text-ink">
            Automate Your Business Infrastructure with{" "}
            <span className="text-gradient">Production-Ready n8n Workflows</span>
          </h1>

          <p className="mt-6 max-w-[60ch] text-lg text-ink-2 md:text-xl">
            Deploy battle-tested Facebook Messenger CRMs, Automated Lead Scraping, Multi-channel Content
            Distribution, and Custom AI Agents in 1-Click.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/workflows">Explore {catalogCountLabel} Workflows</Link>
            </Button>
            <Button asChild variant="secondary-outline" size="lg">
              <Link href="/services#book">Book Done-For-You Setup</Link>
            </Button>
          </div>

          <ul className="mt-6 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
            {microCopy.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check aria-hidden="true" size={16} className="text-teal-700" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5">
          <HeroFlowVisual />
        </div>
      </div>
    </section>
  );
}
