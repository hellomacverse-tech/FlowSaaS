import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Testimonial } from "@/data/testimonials";
import type { CaseStudy } from "@/data/case-studies";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="relative flex h-full flex-col p-6">
      {testimonial.isSeed ? (
        <span className="absolute right-4 top-4 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn">
          Sample
        </span>
      ) : null}
      <p className="text-sm text-ink-2">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="mt-5 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-violet-600">
          {initials(testimonial.authorName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{testimonial.authorName}</p>
          <p className="truncate text-xs text-muted">
            {testimonial.authorRole}, {testimonial.company}
          </p>
        </div>
      </div>
      <Badge tone="teal" className="mt-4 w-fit">
        {testimonial.metricValue}
      </Badge>
    </Card>
  );
}

export function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <Card className="relative flex h-full flex-col p-6">
      {caseStudy.isSeed ? (
        <span className="absolute right-4 top-4 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn">
          Sample
        </span>
      ) : null}
      <Badge tone="slate" className="w-fit">
        {caseStudy.industry}
      </Badge>
      <h3 className="mt-3 text-[15px] font-semibold text-ink">{caseStudy.title}</h3>
      <div className="mt-4 grid grid-cols-1 gap-2">
        {caseStudy.results.map((result) => (
          <p key={result} className="text-sm font-medium text-teal-700">
            {result}
          </p>
        ))}
      </div>
      {/* Individual case-study pages (with Article schema) are Phase 7
          (pSEO & technical SEO) scope — no dedicated URL exists yet. */}
      <span className="mt-5 text-sm font-medium text-muted">Read the story → (coming in Phase 7)</span>
    </Card>
  );
}
