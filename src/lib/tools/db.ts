import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { callN8n, N8nCallError } from "@/lib/n8n/client";
import { runMockTool } from "./mock";
import type { RunToolDeps, ToolRecord } from "./run-tool";

const TOOL_TIMEOUT_MS = 60_000;

/** Production wiring of RunToolDeps: Supabase (service role) + signed n8n or the mock runner. */
export function buildRunToolDeps(service: SupabaseClient): RunToolDeps {
  return {
    async getTool(slug) {
      const { data } = await service
        .from("tools")
        .select("id, slug, credits_per_run, input_schema, output_schema")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id as string,
        slug: data.slug as string,
        creditsPerRun: data.credits_per_run as number,
        inputSchema: data.input_schema as Record<string, unknown>,
        outputSchema: data.output_schema as Record<string, unknown>,
      } satisfies ToolRecord;
    },

    async getCredits(userId) {
      const { data, error } = await service.rpc("credit_status", { p_user: userId }).maybeSingle<{
        credits_included: number;
        credits_used: number;
        remaining: number;
      }>();
      if (error || !data) return null;
      return { included: data.credits_included, used: data.credits_used, remaining: data.remaining };
    },

    async callTool(tool, input) {
      if (env.N8N_MODE === "mock") {
        try {
          return { kind: "ok", output: runMockTool(tool.slug, input as Record<string, unknown>) };
        } catch {
          return { kind: "upstream-error", status: 500 };
        }
      }
      try {
        const res = await callN8n({
          baseUrl: env.N8N_BASE_URL,
          path: `${env.N8N_TOOLS_WEBHOOK_BASE}/${tool.slug}`,
          body: input,
          secret: env.N8N_WEBHOOK_SIGNING_SECRET,
          timeoutMs: TOOL_TIMEOUT_MS,
          retries: 1,
        });
        return res.status >= 200 && res.status < 300 ? { kind: "ok", output: res.json } : { kind: "upstream-error", status: res.status };
      } catch (err) {
        if (err instanceof N8nCallError && err.kind === "timeout") return { kind: "timeout" };
        return { kind: "upstream-error", status: 0 };
      }
    },

    async recordRun(input) {
      const { data, error } = await service
        .rpc("record_tool_run", {
          p_user: input.userId,
          p_tool: input.toolId,
          p_status: input.status,
          p_input: input.input,
          p_output: input.output,
          p_error: input.error,
          p_credits: input.credits,
          p_duration_ms: input.durationMs,
          p_source: input.source,
        })
        .single<{ run_id: string | null; charged: number; credits_remaining: number; insufficient: boolean }>();
      if (error || !data) throw new Error(`record_tool_run failed: ${error?.message ?? "no data"}`);
      return data.insufficient
        ? { insufficient: true, remaining: data.credits_remaining }
        : { insufficient: false, runId: data.run_id as string, charged: data.charged, remaining: data.credits_remaining };
    },
  };
}
