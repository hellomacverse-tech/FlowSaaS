import { PlayCircle } from "lucide-react";
import type { WorkflowDetail } from "@/types/domain";

export function VideoGuideTab({ workflow }: { workflow: WorkflowDetail }) {
  return (
    <div className="flex flex-col gap-6">
      {workflow.video ? null : (
        <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface text-center">
          <PlayCircle aria-hidden="true" size={32} className="text-muted" />
          <p className="text-sm font-medium text-ink-2">Setup video coming soon</p>
          <p className="max-w-xs text-xs text-muted">
            The numbered steps below cover the same setup in the meantime.
          </p>
        </div>
      )}

      <ol className="flex flex-col gap-4">
        {workflow.howToSteps.map((step) => (
          <li key={step.step} id={`step-${step.step}`} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-600">
              {step.step}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{step.name}</p>
              <p className="mt-0.5 text-sm text-ink-2">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
