"use client";

import { useCallback, useRef, useState } from "react";
import type { SandboxStep } from "@/types/domain";

export type SandboxRunState = "idle" | "queued" | "running" | "success" | "error" | "rate-limited";

interface State {
  state: SandboxRunState;
  steps: SandboxStep[];
  output: unknown;
  durationMs: number | null;
  runId: string | null;
}

/**
 * Drives a real sandbox run end to end: POST /api/sandbox/run, then an SSE
 * subscription to /api/sandbox/stream/{runId} with an automatic fallback to
 * polling the same endpoint (Section 7.3 step 3: "Fallback: poll ... if SSE
 * is blocked"). Shared by the home page's LiveSandbox and the per-workflow
 * WorkflowSandboxPreview, so the run/stream/fallback logic exists exactly
 * once.
 */
export function useSandboxRun() {
  const [data, setData] = useState<State>({ state: "idle", steps: [], output: null, durationMs: null, runId: null });
  const sourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = null;
  }, []);

  const startPolling = useCallback(
    (runId: string) => {
      const tick = async () => {
        try {
          const res = await fetch(`/api/sandbox/stream/${runId}?poll=1`);
          const json = await res.json();
          if (json.event === "result") {
            setData((d) => ({ ...d, state: json.data.status === "succeeded" ? "success" : "error", steps: json.data.steps, output: json.data.output, durationMs: json.data.durationMs }));
            return;
          }
          setData((d) => ({ ...d, state: "running", steps: json.data.steps }));
          pollRef.current = setTimeout(tick, 800);
        } catch {
          setData((d) => ({ ...d, state: "error" }));
        }
      };
      void tick();
    },
    [],
  );

  const run = useCallback(
    async (workflowSlug: string, input: string, turnstileToken: string) => {
      // The 5/h (anon) / 20/h (signed-in) sandbox limit is enforced
      // server-side in /api/sandbox/run; a 429 there flips state to
      // "rate-limited" below. No client-side counter is needed or kept.
      cleanup();
      setData({ state: "queued", steps: [], output: null, durationMs: null, runId: null });

      let runId: string;
      try {
        const res = await fetch("/api/sandbox/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workflowSlug, input, turnstileToken }),
        });
        const json = await res.json();
        if (res.status === 429) {
          setData((d) => ({ ...d, state: "rate-limited" }));
          return;
        }
        if (!res.ok || !json.ok) throw new Error(json.error ?? "run-failed");
        runId = json.runId;
      } catch {
        setData((d) => ({ ...d, state: "error" }));
        return;
      }

      setData((d) => ({ ...d, runId, state: "running" }));

      if (typeof EventSource === "undefined") {
        startPolling(runId);
        return;
      }

      const source = new EventSource(`/api/sandbox/stream/${runId}`);
      sourceRef.current = source;
      let sawEvent = false;

      source.addEventListener("step", (event) => {
        sawEvent = true;
        const parsed = JSON.parse((event as MessageEvent).data);
        setData((d) => ({ ...d, state: "running", steps: parsed.steps }));
      });
      source.addEventListener("result", (event) => {
        sawEvent = true;
        const parsed = JSON.parse((event as MessageEvent).data);
        setData((d) => ({ ...d, state: parsed.status === "succeeded" ? "success" : "error", steps: parsed.steps, output: parsed.output, durationMs: parsed.durationMs }));
        cleanup();
      });
      source.onerror = () => {
        // SSE blocked by a proxy, or the connection dropped before any event
        // arrived — fall back to polling rather than surfacing an error for
        // what might just be a network hiccup.
        if (!sawEvent) {
          cleanup();
          startPolling(runId);
        }
      };
    },
    [cleanup, startPolling],
  );

  return { ...data, run, reset: () => { cleanup(); setData({ state: "idle", steps: [], output: null, durationMs: null, runId: null }); } };
}
