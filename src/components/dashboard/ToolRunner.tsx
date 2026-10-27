"use client";

import { useState } from "react";
import { Copy, Check, Download, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { AutoForm } from "./AutoForm";
import type { ToolSeed } from "@/data/tools";

type RunState = { kind: "idle" } | { kind: "running" } | { kind: "success"; output: unknown; runId: string; creditsCharged: number; creditsRemaining: number } | { kind: "error"; message: string };

function toCsv(output: unknown): string {
  if (!output || typeof output !== "object") return String(output);
  const flat = Array.isArray(output) ? output : Object.values(output as Record<string, unknown>).find(Array.isArray) ?? [output];
  const rows = flat as Record<string, unknown>[];
  if (rows.length === 0 || typeof rows[0] !== "object") return JSON.stringify(output);
  const headers = Object.keys(rows[0] as object);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape((row as Record<string, unknown>)[h])).join(","))].join("\n");
}

export function ToolRunner({ tool }: { tool: ToolSeed }) {
  const [state, setState] = useState<RunState>({ kind: "idle" });
  const [history, setHistory] = useState<{ input: unknown; output: unknown; at: string }[]>([]);
  const [showApi, setShowApi] = useState(false);
  const [copied, setCopied] = useState(false);

  async function run(input: Record<string, unknown>) {
    setState({ kind: "running" });
    try {
      const res = await fetch(`/api/tools/${tool.slug}/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setState({ kind: "error", message: json.message ?? "Something went wrong." });
        return;
      }
      setState({ kind: "success", output: json.output, runId: json.runId, creditsCharged: json.creditsCharged, creditsRemaining: json.creditsRemaining });
      setHistory((h) => [{ input, output: json.output, at: new Date().toLocaleTimeString() }, ...h].slice(0, 5));
    } catch {
      setState({ kind: "error", message: "Network error — please try again." });
    }
  }

  function downloadCsv(output: unknown) {
    const blob = new Blob([toCsv(output)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tool.slug}-result.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyJson(output: unknown) {
    await navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const curl = `curl -X POST https://flowsaas.com/api/v1/run \\\n  -H "Authorization: Bearer $FLOWSAAS_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ tool: tool.slug, input: tool.exampleInput })}'`;
  const js = `const res = await fetch("https://flowsaas.com/api/v1/run", {\n  method: "POST",\n  headers: {\n    Authorization: \`Bearer \${process.env.FLOWSAAS_KEY}\`,\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify(${JSON.stringify({ tool: tool.slug, input: tool.exampleInput }, null, 2)}),\n});\nconst { output } = await res.json();`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <p className="text-sm font-semibold text-ink">
          Run tool <span className="text-muted">· uses {tool.creditsPerRun} credit{tool.creditsPerRun === 1 ? "" : "s"}</span>
        </p>
        <div className="mt-4">
          <AutoForm schema={tool.inputSchema} submitting={state.kind === "running"} submitLabel={`Run tool`} onSubmit={run} />
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="p-6">
          {state.kind === "idle" && <p className="text-sm text-muted">Fill in the form and run the tool to see a result here.</p>}
          {state.kind === "running" && (
            <div className="flex items-center gap-2 text-sm text-ink-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              Running…
            </div>
          )}
          {state.kind === "error" && (
            <div>
              <p className="text-sm font-medium text-danger">{state.message}</p>
              <p className="mt-1 text-xs text-muted">Not charged.</p>
            </div>
          )}
          {state.kind === "success" && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-teal-700">Success</p>
                <p className="text-xs text-muted">
                  −{state.creditsCharged} credit{state.creditsCharged === 1 ? "" : "s"} · {state.creditsRemaining} left
                </p>
              </div>
              <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-surface p-3 font-mono text-xs text-ink-2">{JSON.stringify(state.output, null, 2)}</pre>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => copyJson(state.output)} className="inline-flex items-center gap-1.5 rounded-lg border border-line/70 px-3 py-1.5 text-xs font-medium hover:bg-surface">
                  {copied ? <Check aria-hidden="true" size={13} /> : <Copy aria-hidden="true" size={13} />}
                  Copy JSON
                </button>
                <button type="button" onClick={() => downloadCsv(state.output)} className="inline-flex items-center gap-1.5 rounded-lg border border-line/70 px-3 py-1.5 text-xs font-medium hover:bg-surface">
                  <Download aria-hidden="true" size={13} />
                  Download CSV
                </button>
              </div>
            </div>
          )}
        </Card>

        {history.length > 0 ? (
          <Card className="p-6">
            <p className="text-sm font-semibold text-ink">History</p>
            <ul className="mt-2 flex flex-col gap-2">
              {history.map((h, i) => (
                <li key={i} className="text-xs text-muted">
                  {h.at} — {JSON.stringify(h.output).slice(0, 80)}…
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card className="p-0">
          <button type="button" onClick={() => setShowApi((v) => !v)} className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-ink">
            Use via API
            <ChevronDown aria-hidden="true" size={16} className={showApi ? "rotate-180" : ""} />
          </button>
          {showApi ? (
            <div className="flex flex-col gap-3 p-4 pt-0">
              <CodeBlock language="bash" code={curl} />
              <CodeBlock language="javascript" code={js} />
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
