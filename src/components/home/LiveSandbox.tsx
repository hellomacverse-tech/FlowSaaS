"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, AlertTriangle, Check as CheckIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Badge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { GradientSpheres } from "@/components/layout/GradientSpheres";
import { Turnstile } from "@/components/security/Turnstile";
import { useSandboxRun } from "@/hooks/useSandboxRun";
import { getSandboxCopy } from "@/data/sandbox-copy";
import { getWorkflowDetail } from "@/data/workflow-details";

type ScenarioKey = "messenger" | "lead" | "shopify";

// Each home-page scenario is a REAL launch workflow with sandbox_supported
// = true — this demo runs the actual /api/sandbox/run + stream pipeline
// (Section 7.3), not a local simulation. The label is the friendly scenario
// name from the spec; the slug is what actually gets a signed n8n run (or,
// in N8N_MODE=mock, the deterministic in-process runner).
const scenarioSlugs: Record<ScenarioKey, string> = {
  messenger: "facebook-messenger-crm-google-sheets",
  lead: "google-maps-lead-scraper-airtable",
  shopify: "shopify-order-telegram-fulfilment-sheet",
};
const scenarioLabels: Record<ScenarioKey, string> = { messenger: "Messenger Trigger", lead: "Lead Query", shopify: "Shopify Order" };

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function LiveSandbox() {
  const [scenario, setScenario] = useState<ScenarioKey>("messenger");
  const slug = scenarioSlugs[scenario];
  const workflow = getWorkflowDetail(slug)!;
  const copy = getSandboxCopy(workflow);

  const [input, setInput] = useState(copy.placeholder);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "json" | "timeline">("preview");
  const sandbox = useSandboxRun();

  function switchScenario(key: ScenarioKey) {
    setScenario(key);
    setInput(getSandboxCopy(getWorkflowDetail(scenarioSlugs[key])!).placeholder);
    sandbox.reset();
    setActiveTab("preview");
  }

  function runAutomation() {
    if (!turnstileToken) return;
    setActiveTab("preview");
    void sandbox.run(slug, input, turnstileToken);
  }

  const doneCount = sandbox.steps.filter((s) => s.status === "done").length;
  const progress = sandbox.steps.length > 0 ? (doneCount / sandbox.steps.length) * 100 : 0;
  const charCount = input.length;
  const state = sandbox.state;

  return (
    <section id="sandbox" aria-labelledby="sandbox-heading" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-caption text-violet-600">LIVE DEMO</p>
        <h2 id="sandbox-heading" className="text-h2 mt-2 max-w-2xl text-ink">
          Try Live Automation Before You Buy
        </h2>
        <p className="prose-measure mt-3 text-ink-2">
          Type a sample lead query or Facebook Messenger trigger below and watch our background n8n webhook
          execute in real-time.
        </p>

        <Card className="relative mt-8 overflow-hidden p-0">
          <GradientSpheres variant="accent" color="violet" />
          <div className="grid grid-cols-1 divide-y divide-line/70 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            <div className="p-6">
              <div role="tablist" aria-label="Sandbox scenario" className="flex flex-wrap gap-2">
                {(Object.keys(scenarioSlugs) as ScenarioKey[]).map((key) => (
                  <Chip key={key} role="tab" aria-selected={scenario === key} active={scenario === key} onClick={() => switchScenario(key)}>
                    {scenarioLabels[key]}
                  </Chip>
                ))}
              </div>

              <label htmlFor="sandbox-input" className="mt-5 block text-sm font-medium text-ink">
                Sample input
              </label>
              <textarea
                id="sandbox-input"
                value={input}
                maxLength={280}
                onChange={(event) => setInput(event.target.value)}
                rows={4}
                className="mt-1.5 w-full rounded-xl border border-line/70 px-3.5 py-2.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
              <p className="mt-1 text-right text-xs text-muted">{charCount}/280</p>

              <div className="mt-2 flex flex-wrap gap-2">
                {copy.presets.map((preset) => (
                  <button key={preset} type="button" onClick={() => setInput(preset)} className="rounded-full border border-line/70 px-3 py-1.5 text-xs text-ink-2 hover:bg-surface">
                    {preset}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setTurnstileToken} />
              </div>

              <Button onClick={runAutomation} disabled={!turnstileToken} loading={state === "queued" || state === "running"} className="mt-4 w-full sm:w-auto">
                <Play aria-hidden="true" size={16} />
                {state === "queued" || state === "running" ? "Running…" : "Run Automation"}
              </Button>
              <p className="mt-2 text-xs text-muted">5 free runs per hour. Sandbox uses sample data — nothing is sent to real accounts.</p>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {state === "idle" && "Idle"}
                  {state === "queued" && "Signing request…"}
                  {state === "running" && "Running"}
                  {state === "success" && "Completed"}
                  {state === "error" && "Error"}
                  {state === "rate-limited" && "Rate limited"}
                </span>
                {state === "success" && sandbox.durationMs ? <span className="font-mono text-xs text-muted">{(sandbox.durationMs / 1000).toFixed(1)}s</span> : null}
              </div>

              <div aria-live="polite" className="mt-4">
                {state === "idle" && (
                  <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-line text-center text-sm text-muted">
                    Your live execution will appear here.
                  </div>
                )}

                {(state === "queued" || state === "running") && (
                  <div className="flex flex-col items-center gap-6 py-4">
                    <ProgressRing value={progress} label="Sandbox run progress" size={120} strokeWidth={10}>
                      <span className="text-2xl font-extrabold text-ink">{Math.round(progress)}%</span>
                    </ProgressRing>
                    <ol className="w-full max-w-xs space-y-2.5">
                      {sandbox.steps.map((step) => (
                        <li key={step.key} className="flex items-center gap-2.5 text-sm">
                          {step.status === "done" ? (
                            <CheckIcon aria-hidden="true" size={16} className="shrink-0 text-teal-700" />
                          ) : step.status === "running" ? (
                            <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                          ) : (
                            <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border-2 border-line" />
                          )}
                          <span className={step.status === "pending" ? "text-muted" : "text-ink-2"}>{step.label}</span>
                          {step.ms ? <span className="ml-auto font-mono text-xs text-muted">{step.ms}ms</span> : null}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {state === "success" && (
                  <div>
                    <div role="tablist" aria-label="Result view" className="flex gap-1 border-b border-line/70">
                      {(["preview", "json", "timeline"] as const).map((tab) => (
                        <button
                          key={tab}
                          role="tab"
                          aria-selected={activeTab === tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-3 py-2 text-sm font-medium capitalize ${activeTab === tab ? "border-b-2 border-violet-500 text-ink" : "text-muted hover:text-ink-2"}`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4">
                      {activeTab === "preview" && (
                        <div className="rounded-xl border border-line/70 p-4">
                          <p className="text-sm text-ink-2">{copy.previewNote}</p>
                          <p className="mt-2 text-xs text-muted">Ran against {workflow.title}, using the workflow&apos;s own documented nodes as steps.</p>
                        </div>
                      )}
                      {activeTab === "json" && <pre className="overflow-x-auto rounded-xl bg-ink p-4 font-mono text-xs text-white">{JSON.stringify(sandbox.output, null, 2)}</pre>}
                      {activeTab === "timeline" && (
                        <ol className="space-y-2 text-sm text-ink-2">
                          {sandbox.steps.map((step, i) => (
                            <li key={step.key}>
                              {i + 1}. {step.label} — {step.ms}ms
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-muted">
                      Completed in {sandbox.durationMs ? (sandbox.durationMs / 1000).toFixed(1) : "—"}s · Run ID {sandbox.runId?.slice(0, 8)}
                    </p>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button asChild size="sm">
                        <Link href={`/workflows/${slug}`}>Get this workflow</Link>
                      </Button>
                      <Button asChild size="sm" variant="secondary-outline">
                        <Link href="/signup">Deploy in 1 click</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {state === "error" && (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <AlertTriangle aria-hidden="true" size={28} className="text-coral-600" />
                    <p className="max-w-xs text-sm text-ink-2">This run took longer than expected and was stopped safely. Try again or pick another preset.</p>
                    <Button size="sm" onClick={runAutomation}>
                      Retry
                    </Button>
                  </div>
                )}

                {state === "rate-limited" && (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <p className="max-w-xs text-sm text-violet-600">You&apos;ve used your 5 free runs for this hour. Sign up free to get 20/hour.</p>
                    <Button asChild size="sm">
                      <Link href="/signup">Get Started Free</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
