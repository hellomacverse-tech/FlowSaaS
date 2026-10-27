import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { WorkflowSummary } from "@/types/domain";

const statusTone: Record<WorkflowSummary["status"], { label: string; tone: "teal" | "violet" | "amber" }> = {
  live: { label: "Live", tone: "teal" },
  beta: { label: "Beta", tone: "violet" },
  updating: { label: "Updating", tone: "amber" },
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function isNew(publishedAt: string): boolean {
  const days = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days < 14;
}

export function WorkflowCard({ workflow }: { workflow: WorkflowSummary }) {
  const status = statusTone[workflow.status];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-line/70 bg-white shadow-sm transition-[transform,box-shadow] duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md">
      {/* Thumbnail: flow silhouette on a pastel tinted tile — real rendered
          graph PNGs are generated at build time once Phase 3 wires the
          workflow graph renderer (Section 9.3) up to this card. */}
      <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-gradient-to-br from-teal-50 via-white to-violet-50">
        <div className="absolute left-3 top-3">
          <Badge tone={status.tone}>
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
            {status.label}
          </Badge>
        </div>
        {isNew(workflow.publishedAt) ? (
          <div className="absolute right-3 top-3">
            <Badge tone="coral">New</Badge>
          </div>
        ) : null}
        <svg
          aria-hidden="true"
          viewBox="0 0 320 180"
          className="absolute inset-0 h-full w-full opacity-40"
        >
          <circle cx="60" cy="90" r="10" fill="#14b8a6" />
          <circle cx="160" cy="50" r="10" fill="#8b5cf6" />
          <circle cx="260" cy="110" r="10" fill="#ff6b6b" />
          <path d="M60 90 L160 50 L260 110" stroke="#cbd5e1" strokeWidth="2" fill="none" />
        </svg>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {workflow.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} tone="slate">
              {tag}
            </Badge>
          ))}
        </div>

        <div>
          <Link href={`/workflows/${workflow.slug}` as const} className="hover:underline">
            <h3 className="line-clamp-2 text-[15px] font-semibold text-ink">{workflow.title}</h3>
          </Link>
          <p className="mt-1 line-clamp-1 text-sm text-muted">{workflow.summary}</p>
        </div>

        <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
          <Clock aria-hidden="true" size={13} />
          Saves {workflow.roiHoursPerWeek} hrs/week
        </div>

        <div className="flex items-center gap-3 text-xs text-muted">
          {workflow.rating ? (
            <span>
              ★ {workflow.rating.average.toFixed(1)} ({workflow.rating.count})
            </span>
          ) : (
            <Badge tone="violet">New</Badge>
          )}
          <span>Setup {workflow.setupMinutes} min</span>
          <span className="capitalize">{workflow.difficulty}</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/70 pt-3">
          <div>
            <p className="text-lg font-extrabold text-ink">{formatPrice(workflow.price.amountCents)}</p>
            {workflow.vipIncluded ? <p className="text-xs text-muted">or $29/mo VIP</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              aria-label={`Quick view ${workflow.title}`}
              className="!px-2.5"
            >
              <Link href={`/workflows/${workflow.slug}` as const}>
                <Eye aria-hidden="true" size={16} />
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/workflows/${workflow.slug}` as const}>
                Buy {formatPrice(workflow.price.amountCents)}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
