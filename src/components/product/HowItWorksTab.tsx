import { WorkflowGraphSvg } from "./WorkflowGraphSvg";
import type { WorkflowDetail } from "@/types/domain";

function renderMarkdownLite(md: string) {
  return md.split("\n\n").map((paragraph, i) => {
    const match = paragraph.match(/^\*\*(.+?):\*\*\s*(.*)$/s);
    if (match) {
      return (
        <p key={i} className="text-sm text-ink-2">
          <strong className="text-ink">{match[1]}:</strong> {match[2]}
        </p>
      );
    }
    return (
      <p key={i} className="text-sm text-ink-2">
        {paragraph}
      </p>
    );
  });
}

const GROUP_LABEL: Record<string, string> = {
  trigger: "Trigger",
  logic: "Logic",
  ai: "AI",
  data: "Data",
  output: "Output",
};

export function HowItWorksTab({ workflow }: { workflow: WorkflowDetail }) {
  const trigger = workflow.nodes.filter((_, i) => workflow.graph.nodes[i]?.group === "trigger");
  const processing = workflow.nodes.filter((_, i) =>
    ["logic", "ai", "data"].includes(workflow.graph.nodes[i]?.group ?? ""),
  );
  const output = workflow.nodes.filter((_, i) => workflow.graph.nodes[i]?.group === "output");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">{renderMarkdownLite(workflow.descriptionMd)}</div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Trigger", nodes: trigger, tone: "coral" },
          { label: "Processing", nodes: processing.slice(0, 4), tone: "violet" },
          { label: "Output", nodes: output, tone: "teal" },
        ].map((col) => (
          <div key={col.label} className="rounded-xl border border-line/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{col.label}</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {col.nodes.map((node) => (
                <li key={node.name} className="text-sm text-ink-2">
                  {node.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Architecture diagram</p>
        <div className="overflow-x-auto rounded-xl border border-line/70 bg-surface p-4">
          <WorkflowGraphSvg graph={workflow.graph} />
        </div>
        <p className="mt-2 text-xs text-muted">
          Colored bars mark each node&apos;s role: {Object.entries(GROUP_LABEL).map(([, l]) => l).join(" · ")}.
        </p>
      </div>

      <div className="rounded-xl border border-line/70 p-4">
        <p className="text-sm font-semibold text-ink">Before / After</p>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-danger">Before</p>
            <p className="mt-1 text-sm text-ink-2">Manual, inconsistent, and easy to forget.</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-teal-700">After</p>
            <p className="mt-1 text-sm text-ink-2">Saves {workflow.roiHoursPerWeek} hrs/week, automatically.</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-ink">Limits &amp; good to know</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-2">
          <li>Requires n8n {workflow.n8nMinVersion} or newer.</li>
          {workflow.integrations.includes("facebook-messenger") ? (
            <li>Messenger replies respect Meta&apos;s 24-hour standard messaging window.</li>
          ) : null}
          <li>Third-party API rate limits apply — see each connected app&apos;s own limits.</li>
        </ul>
      </div>
    </div>
  );
}
