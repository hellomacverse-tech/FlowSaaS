import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getUsageDaily } from "@/lib/dashboard/usage";
import { KeyMetricCard } from "@/components/dashboard/KeyMetricCard";
import { AccountInfoCard } from "@/components/dashboard/AccountInfoCard";
import { UsageBarChart } from "@/components/dashboard/UsageBarChart";
import { RecentRuns, type RecentRun } from "@/components/dashboard/RecentRuns";
import { QuickLaunchTools } from "@/components/dashboard/QuickLaunchTools";
import { Card } from "@/components/ui/Card";

export const metadata = { robots: { index: false, follow: false } };

export default async function AppOverviewPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, tier, license_key, credits_included, credits_used, credits_reset_at, stripe_customer_id")
    .eq("id", user.id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("current_period_end, trial_end, status")
    .eq("user_id", user.id)
    .maybeSingle();

  const service = createServiceClient();
  const usageDays = await getUsageDaily(service, user.id, 14);
  const runsThisMonth = usageDays.reduce((sum, d) => sum + d.executions, 0);

  const { data: runRows } = await supabase
    .from("tool_runs")
    .select("id, status, created_at, duration_ms, credits_charged, tools ( name )")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const recentRuns: RecentRun[] = (runRows ?? []).map((row) => {
    const tool = Array.isArray(row.tools) ? row.tools[0] : row.tools;
    return {
      id: row.id as string,
      toolName: (tool as { name?: string } | null)?.name ?? "Unknown tool",
      status: row.status as RecentRun["status"],
      createdAt: row.created_at as string,
      durationMs: row.duration_ms as number | null,
      creditsCharged: row.credits_charged as number,
    };
  });

  if (!profile) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-danger">Couldn&apos;t load your account. Try refreshing, or contact support if this persists.</p>
      </Card>
    );
  }

  const renewsAt = subscription?.status === "trialing" ? subscription.trial_end : subscription?.current_period_end;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h3 text-ink">Overview</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <KeyMetricCard creditsUsed={profile.credits_used} creditsIncluded={profile.credits_included} runsThisMonth={runsThisMonth} resetsAt={profile.credits_reset_at} />
        </div>
        <div className="lg:col-span-5">
          <AccountInfoCard
            email={profile.email}
            fullName={profile.full_name}
            tier={profile.tier as "free" | "vip" | "enterprise"}
            licenseKey={profile.license_key}
            renewsAt={renewsAt ?? null}
            hasStripeCustomer={Boolean(profile.stripe_customer_id)}
          />
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Usage — last 14 days</p>
          <a href="/app/usage" className="text-xs font-medium text-violet-600 hover:underline">
            View all →
          </a>
        </div>
        <div className="mt-4">
          <UsageBarChart days={usageDays} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <RecentRuns runs={recentRuns} />
        </div>
        <div className="lg:col-span-5">
          <QuickLaunchTools />
        </div>
      </div>
    </div>
  );
}
