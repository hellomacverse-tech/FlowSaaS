import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GradientSpheres } from "@/components/layout/GradientSpheres";

export function FinalCta() {
  return (
    <section id="final-cta" aria-labelledby="final-cta-heading" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl p-10 text-center shadow-md sm:p-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{ background: "linear-gradient(90deg, rgba(20,184,166,0.08) 0%, rgba(139,92,246,0.08) 100%)" }}
          />
          <GradientSpheres variant="accent" color="teal" />
          <h2 id="final-cta-heading" className="text-h2 text-ink">
            Stop Doing It by Hand.
          </h2>
          <p className="prose-measure mx-auto mt-3 text-ink-2">
            Import your first workflow in minutes — or let our engineers do it for you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button asChild variant="secondary-outline" size="lg">
              <Link href="/services#book">Book Done-For-You Setup</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
