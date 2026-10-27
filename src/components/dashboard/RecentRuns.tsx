import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface RecentRun {
  id: string;
  toolName: string;
  status: "queued" | "running" | "succeeded" | "failed" | "timeout" | "rate_limited";
  createdAt: string;
  durationMs: number | null;
  creditsCharged: number;
}

const STATUS_TONE: Record<RecentRun["status"], "teal" | "coral" | "amber" | "slate"> = {
  succeeded: "teal",
  failed: "coral",
  timeout: "coral",
  rate_limited: "amber",
  queued: "slate",
  running: "slate",
};

export function RecentRuns({ runs }: { runs: RecentRun[] }) {
  return (
    <Card className="p-6">
      <p className="text-sm font-semibold text-ink">Recent runs</p>
      {runs.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No runs yet — try a tool to see it here.</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-line/70">
          {runs.map((run) => (
            <li key={run.id} className="flex items-center justify-between py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{run.toolName}</p>
                <p className="text-xs text-muted">{new Date(run.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {run.durationMs !== null ? <span className="text-xs text-muted">{run.durationMs}ms</span> : null}
                <Badge tone={STATUS_TONE[run.status]} className="capitalize">
                  {run.status.replace("_", " ")}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
