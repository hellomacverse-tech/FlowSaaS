"use client";

import { useState } from "react";
import { Play, Check as CheckIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Turnstile } from "@/components/security/Turnstile";
import { useSandboxRun } from "@/hooks/useSandboxRun";
import type { WorkflowDetail } from "@/types/domain";
import { getSandboxCopy } from "@/data/sandbox-copy";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/**
 * Runs against the real /api/sandbox/run + stream pipeline for this exact
 * workflow, locked to a single scenario (no tab switcher) — the compact
 * counterpart to the home page's three-scenario `LiveSandbox` (Section
 * 9.3 point 2: "same engine as 9.1.3, scenario locked to this workflow").
 */
export function WorkflowSandboxPreview({ workflow }: { workflow: WorkflowDetail }) {
  const copy = getSandboxCopy(workflow);
  const [input, setInput] = useState(copy.placeholder);
  const [turnstileToken, setTurnstileToken] = useState("");
  const sandbox = useSandboxRun();

  if (!workflow.sandboxSupported) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm font-semibold text-ink">Demo video coming soon</p>
        <p className="mt-1.5 text-sm text-ink-2">
          This workflow doesn&apos;t have a live sandbox yet — the setup video (Tab 2) walks through exactly what it does.
        </p>
      </Card>
    );
  }

  const doneCount = sandbox.steps.filter((s) => s.status === "done").length;
  const progress = sandbox.steps.length > 0 ? (doneCount / sandbox.steps.length) * 100 : 0;

  return (
    <Card className="p-6">
      <p className="text-sm font-semibold text-ink">Try it with sample data</p>
      <label htmlFor="product-sandbox-input" className="sr-only">
        Sample input
      </label>
      <textarea
        id="product-sandbox-input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={2}
        maxLength={280}
        className="mt-2 w-full rounded-xl border border-line/70 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      />
      {copy.presets.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {copy.presets.map((preset) => (
            <button key={preset} type="button" onClick={() => setInput(preset)} className="rounded-full border border-line/70 px-3 py-1 text-xs text-ink-2 hover:bg-surface">
              {preset}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3">
        <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setTurnstileToken} />
      </div>

      <Button onClick={() => turnstileToken && sandbox.run(workflow.slug, input, turnstileToken)} disabled={!turnstileToken} loading={sandbox.state === "queued" || sandbox.state === "running"} className="mt-4">
        <Play aria-hidden="true" size={16} />
        Run Automation
      </Button>
      <p className="mt-1.5 text-xs text-muted">Sandbox uses sample data — nothing is sent to real accounts.</p>

      {sandbox.state !== "idle" && sandbox.state !== "success" ? (
        <div aria-live="polite" className="mt-5 flex items-center gap-5">
          <ProgressRing value={progress} label="Run progress" size={72} strokeWidth={7}>
            <span className="text-sm font-bold text-ink">{Math.round(progress)}%</span>
          </ProgressRing>
          <ol className="flex-1 space-y-1.5 text-xs">
            {sandbox.steps.map((step) => (
              <li key={step.key} className="flex items-center gap-2">
                {step.status === "done" ? <CheckIcon aria-hidden="true" size={13} className="text-teal-700" /> : <span className="h-[13px] w-[13px] rounded-full border-2 border-line" />}
                <span className={step.status === "done" ? "text-ink-2" : "text-muted"}>{step.label}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {sandbox.state === "rate-limited" ? <p className="mt-4 text-sm text-violet-600">You&apos;ve used your free runs for this hour. Sign up free for more.</p> : null}
      {sandbox.state === "error" ? <p className="mt-4 text-sm text-danger">That run didn&apos;t complete. Try again.</p> : null}
      {sandbox.state === "success" ? <p className="mt-4 rounded-lg bg-violet-50 p-3 text-sm text-ink-2">{copy.previewNote}</p> : null}
    </Card>
  );
}
