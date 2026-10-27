import { Star } from "lucide-react";
import type { WorkflowDetail } from "@/types/domain";

export function ReviewsTab({ workflow }: { workflow: WorkflowDetail }) {
  if (workflow.rating) {
    // Rendering path for once real approved reviews exist (Phase 4) — kept
    // here so this component doesn't need a rewrite when that data shows up.
    return (
      <div>
        <p className="text-3xl font-extrabold text-ink">{workflow.rating.average.toFixed(1)}</p>
        <p className="text-sm text-muted">{workflow.rating.count} reviews</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line py-12 text-center">
      <Star aria-hidden="true" size={24} className="text-muted" />
      <p className="text-sm font-medium text-ink-2">No reviews yet. Be the first verified buyer to share results.</p>
      <p className="max-w-xs text-xs text-muted">
        Reviews open up to verified buyers once purchases are live (Phase 4).
      </p>
    </div>
  );
}
