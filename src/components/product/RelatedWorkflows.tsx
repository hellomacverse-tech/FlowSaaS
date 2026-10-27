import { WorkflowCard } from "@/components/catalog/WorkflowCard";
import { catalogSeed } from "@/data/catalog-seed";
import type { WorkflowSummary } from "@/types/domain";

export function RelatedWorkflows({ current }: { current: WorkflowSummary }) {
  const related = catalogSeed
    .filter((w) => w.slug !== current.slug && w.categories.some((c) => current.categories.includes(c)))
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div>
      <p className="text-h3 mb-4 text-ink">Related workflows</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {related.map((workflow) => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
      </div>
    </div>
  );
}
