import { TestimonialCard, CaseStudyCard } from "./ProofCards";
import { testimonials } from "@/data/testimonials";
import { caseStudies } from "@/data/case-studies";

/**
 * Only `verified` items render in production. Seed items (all six
 * testimonials and three case studies are currently seed content) render
 * only when NEXT_PUBLIC_SHOW_SEED_CONTENT=true (preview/staging), each
 * carrying a visible "SAMPLE" ribbon (Section 9.1.7 / Section 16).
 */
export function ProofSection() {
  const showSeed = process.env.NEXT_PUBLIC_SHOW_SEED_CONTENT === "true";

  const visibleTestimonials = testimonials.filter((t) => t.verified || (t.isSeed && showSeed));
  const visibleCaseStudies = caseStudies.filter((c) => c.verified || (c.isSeed && showSeed));

  if (visibleTestimonials.length === 0 && visibleCaseStudies.length === 0) {
    return null;
  }

  return (
    <section id="proof" aria-labelledby="proof-heading" className="bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-caption text-violet-600">CUSTOMER RESULTS</p>
        <h2 id="proof-heading" className="text-h2 mt-2 max-w-2xl text-ink">
          Teams That Stopped Doing Repetitive Work
        </h2>
        <p className="prose-measure mt-3 text-ink-2">Real setups, real numbers.</p>

        {visibleTestimonials.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleTestimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        ) : null}

        {visibleCaseStudies.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleCaseStudies.map((caseStudy) => (
              <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
