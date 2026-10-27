import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { WorkflowDetail } from "@/types/domain";

export function QuickViewContent({ workflow }: { workflow: WorkflowDetail }) {
  return (
    <div>
      <div className="aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-teal-50 via-white to-violet-50" />

      <h2 className="text-h3 mt-4 pr-8 text-ink">{workflow.title}</h2>
      <p className="mt-1.5 text-sm text-ink-2">{workflow.summary}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {workflow.integrations.slice(0, 6).map((slug) => (
          <Badge key={slug} tone="slate" className="capitalize">
            {slug.replace(/-/g, " ")}
          </Badge>
        ))}
      </div>

      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
        <Clock aria-hidden="true" size={13} />
        Saves {workflow.roiHoursPerWeek} hrs/week
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {workflow.requirements.map((req) => (
          <span
            key={req.label}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              req.required ? "bg-coral-50 text-coral-700" : "bg-surface-2 text-muted"
            }`}
          >
            {req.label}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-line/70 pt-4">
        <p className="text-xl font-extrabold text-ink">${(workflow.price.amountCents / 100).toFixed(0)}</p>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="secondary-outline">
            <Link href={`/workflows/${workflow.slug}` as const}>View full details</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/workflows/${workflow.slug}` as const}>
              Buy — ${(workflow.price.amountCents / 100).toFixed(0)}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
