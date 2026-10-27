import { CodeBlock } from "@/components/ui/CodeBlock";
import { Accordion } from "@/components/ui/Accordion";
import type { WorkflowDetail } from "@/types/domain";

export function NodesDocsTab({ workflow }: { workflow: WorkflowDetail }) {
  const hasWebhookTrigger = workflow.nodes[0]?.type.toLowerCase().includes("webhook");
  const distinctCredentials = Array.from(
    new Set(workflow.nodes.map((n) => n.credentialsNeeded).filter((c): c is string => Boolean(c))),
  );
  const hasErrorHandler = workflow.nodes.some((n) => n.type === "Error Trigger");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Nodes</p>
        <div className="overflow-x-auto rounded-xl border border-line/70">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Node</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Purpose</th>
                <th className="px-3 py-2">Credentials</th>
              </tr>
            </thead>
            <tbody>
              {workflow.nodes.map((node, i) => (
                <tr key={node.name} id={`node-row-${i}`} className="border-t border-line/70 transition-colors">
                  <td className="px-3 py-2 font-medium text-ink">{node.name}</td>
                  <td className="px-3 py-2 text-ink-2">{node.type}</td>
                  <td className="px-3 py-2 text-ink-2">{node.purpose}</td>
                  <td className="px-3 py-2 text-muted">{node.credentialsNeeded ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {distinctCredentials.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Credentials &amp; scopes</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
            {distinctCredentials.map((cred) => (
              <li key={cred}>{cred}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasWebhookTrigger ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Webhook reference</p>
          <p className="mb-2 text-sm text-ink-2">
            <code className="rounded bg-surface px-1.5 py-0.5">POST</code> to the workflow&apos;s webhook URL
            (shown in n8n after activation). Always returns <code className="rounded bg-surface px-1.5 py-0.5">200</code> within 5s.
          </p>
          <CodeBlock
            language="json"
            code={JSON.stringify(
              { event: "example", data: { id: "123", timestamp: new Date().toISOString() } },
              null,
              2,
            )}
          />
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Error handling &amp; retries</p>
        <p className="text-sm text-ink-2">
          {hasErrorHandler
            ? "This workflow includes a dedicated Error Trigger node that logs failures for review rather than failing silently."
            : "Node-level errors surface in n8n's execution log; add an Error Trigger node if you want failures routed to a channel automatically."}
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Changelog</p>
        <Accordion
          items={workflow.changelog.map((entry) => ({
            id: entry.version,
            question: `v${entry.version} — ${entry.date}`,
            answer: entry.notes,
          }))}
        />
      </div>
    </div>
  );
}
