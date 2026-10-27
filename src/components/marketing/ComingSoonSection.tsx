import { GradientSpheres } from "@/components/layout/GradientSpheres";

/**
 * Used by routes that the Navbar/Footer already link to (so `typedRoutes`
 * resolves them and the site is navigable end to end) but whose full
 * build is scoped to a later phase per Section 17's phase table. Each
 * page still exports real `generateMetadata`, a single `<h1>`, and real
 * (non-lorem-ipsum) copy — it's an honest "not built yet", not a stub
 * pretending to be finished content.
 */
export function ComingSoonSection({
  eyebrow,
  title,
  description,
  phase,
}: {
  eyebrow: string;
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <GradientSpheres variant="accent" color="violet" />
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-caption text-violet-600">{eyebrow}</p>
        <h1 className="text-h2 mt-3 text-ink">{title}</h1>
        <p className="prose-measure mx-auto mt-4 text-ink-2">{description}</p>
        <p className="mt-8 text-sm text-muted">Building in {phase} of the FlowSaaS rollout.</p>
      </div>
    </section>
  );
}
