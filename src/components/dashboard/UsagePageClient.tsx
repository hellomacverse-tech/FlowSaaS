"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UsageBarChart } from "./UsageBarChart";
import type { UsageDay } from "@/lib/dashboard/usage";

export interface ToolRow {
  name: string;
  runs: number;
  succeeded: number;
  credits: number;
  avgMs: number;
}
export interface FailureRow {
  id: string;
  toolName: string;
  error: string | null;
  createdAt: string;
}

const RANGES = [7, 14, 30] as const;

export function UsagePageClient({ days30, toolRows, failures }: { days30: UsageDay[]; toolRows: ToolRow[]; failures: FailureRow[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(14);
  const days = useMemo(() => days30.slice(days30.length - range), [days30, range]);

  const totals = useMemo(() => {
    const executions = days.reduce((s, d) => s + d.executions, 0);
    const failuresCount = days.reduce((s, d) => s + d.failures, 0);
    const credits = days.reduce((s, d) => s + d.credits, 0);
    const successRate = executions === 0 ? null : Math.round(((executions - failuresCount) / executions) * 100);
    return { executions, failuresCount, credits, successRate };
  }, [days]);

  function exportCsv() {
    const header = "date,executions,credits,failures";
    const rows = days.map((d) => `${d.day},${d.executions},${d.credits},${d.failures}`);
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowsaas-usage-${range}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h3 text-ink">Usage Statistics</h1>
        <Button size="sm" variant="secondary-outline" onClick={exportCsv}>
          <Download aria-hidden="true" size={14} />
          Export CSV
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div role="tablist" aria-label="Date range" className="flex gap-1 rounded-xl bg-surface p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={range === r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${range === r ? "bg-white text-ink shadow-xs" : "text-muted"}`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-surface p-3 text-center">
            <p className="text-lg font-bold text-ink">{totals.executions}</p>
            <p className="text-xs text-muted">Total executions</p>
          </div>
          <div className="rounded-xl bg-surface p-3 text-center">
            <p className="text-lg font-bold text-ink">{totals.successRate !== null ? `${totals.successRate}%` : "—"}</p>
            <p className="text-xs text-muted">Success rate</p>
          </div>
          <div className="rounded-xl bg-surface p-3 text-center">
            <p className="text-lg font-bold text-ink">{totals.credits}</p>
            <p className="text-xs text-muted">Credits used</p>
          </div>
        </div>

        <div className="mt-6">
          {totals.executions === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 border-t border-dashed border-line text-center text-sm text-muted">
              Run your first tool to see usage here.
              <Button asChild size="sm">
                <Link href="/app/tools">Open Tools</Link>
              </Button>
            </div>
          ) : (
            <UsageBarChart days={days} height={200} />
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <p className="p-4 pb-0 text-sm font-semibold text-ink">By tool</p>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5">Tool</th>
              <th className="px-4 py-2.5">Runs</th>
              <th className="px-4 py-2.5">Success %</th>
              <th className="px-4 py-2.5">Credits</th>
              <th className="px-4 py-2.5">Avg duration</th>
            </tr>
          </thead>
          <tbody>
            {toolRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No tool runs yet.
                </td>
              </tr>
            ) : (
              toolRows.map((t) => (
                <tr key={t.name} className="border-t border-line/70">
                  <td className="px-4 py-2.5 text-ink">{t.name}</td>
                  <td className="px-4 py-2.5 text-ink-2">{t.runs}</td>
                  <td className="px-4 py-2.5 text-ink-2">{t.runs ? Math.round((t.succeeded / t.runs) * 100) : 0}%</td>
                  <td className="px-4 py-2.5 text-ink-2">{t.credits}</td>
                  <td className="px-4 py-2.5 text-ink-2">{t.avgMs}ms</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold text-ink">Recent failures</p>
        {failures.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No failures — nice.</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-line/70">
            {failures.map((f) => (
              <li key={f.id} className="py-2 text-sm">
                <p className="text-ink-2">
                  <span className="font-medium text-ink">{f.toolName}</span> — {f.error ?? "Unknown error"}
                </p>
                <p className="text-xs text-muted">{new Date(f.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
