import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getUsageDaily } from "@/lib/dashboard/usage";
import { UsagePageClient, type ToolRow, type FailureRow } from "@/components/dashboard/UsagePageClient";

export const metadata = { robots: { index: false, follow: false } };

export default async function UsagePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/usage");

  const service = createServiceClient();
  const days30 = await getUsageDaily(service, user.id, 30);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  const { data: runs } = await supabase
    .from("tool_runs")
    .select("id, status, credits_charged, duration_ms, error, created_at, tools ( name )")
    .eq("user_id", user.id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  const byTool = new Map<string, { runs: number; succeeded: number; credits: number; totalMs: number }>();
  const failures: FailureRow[] = [];

  for (const row of runs ?? []) {
    const toolObj = Array.isArray(row.tools) ? row.tools[0] : row.tools;
    const name = (toolObj as { name?: string } | null)?.name ?? "Unknown tool";
    const entry = byTool.get(name) ?? { runs: 0, succeeded: 0, credits: 0, totalMs: 0 };
    entry.runs += 1;
    if (row.status === "succeeded") entry.succeeded += 1;
    entry.credits += (row.credits_charged as number) ?? 0;
    entry.totalMs += (row.duration_ms as number) ?? 0;
    byTool.set(name, entry);

    if (row.status !== "succeeded" && failures.length < 20) {
      failures.push({ id: row.id as string, toolName: name, error: row.error as string | null, createdAt: row.created_at as string });
    }
  }

  const toolRows: ToolRow[] = Array.from(byTool.entries()).map(([name, v]) => ({
    name,
    runs: v.runs,
    succeeded: v.succeeded,
    credits: v.credits,
    avgMs: v.runs ? Math.round(v.totalMs / v.runs) : 0,
  }));

  return <UsagePageClient days30={days30} toolRows={toolRows} failures={failures} />;
}
