import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface UsageDay {
  day: string; // YYYY-MM-DD
  executions: number;
  credits: number;
  failures: number;
}

/**
 * Fills in zero-rows for every day in the range, so the chart never has to
 * special-case a gap (a day with no runs is a real, visible zero bar, not a
 * missing data point) — Section 9.5's bar chart assumes one bar per day.
 */
export async function getUsageDaily(service: SupabaseClient, userId: string, days: number): Promise<UsageDay[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - (days - 1));

  const { data } = await service
    .from("usage_daily")
    .select("day, executions, credits, failures")
    .eq("user_id", userId)
    .gte("day", from.toISOString().slice(0, 10))
    .order("day", { ascending: true });

  const byDay = new Map((data ?? []).map((row) => [row.day as string, row as UsageDay]));
  const result: UsageDay[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(from);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push(byDay.get(key) ?? { day: key, executions: 0, credits: 0, failures: 0 });
  }
  return result;
}

export function summarize(days: UsageDay[]) {
  const totalExecutions = days.reduce((sum, d) => sum + d.executions, 0);
  const totalFailures = days.reduce((sum, d) => sum + d.failures, 0);
  const successRate = totalExecutions === 0 ? null : Math.round(((totalExecutions - totalFailures) / totalExecutions) * 100);
  return { totalExecutions, totalFailures, successRate };
}
