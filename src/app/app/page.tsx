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

  // ১. প্রথমে প্রোফাইল ফেচ করার চেষ্টা করা
  let { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, tier, license_key, credits_included, credits_used, credits_reset_at, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  // ২. যদি প্রোফাইল না থাকে (যেমন পুরনো ইউজার বা ট্রিগার মিসিং কেস), তবে ব্যাকগ্রাউন্ডে অটো-ক্রিয়েট বা আপসার্ট করে নেওয়া
  if (!profile) {
    const service = createServiceClient();
    const defaultLicense = `FSK-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const { data: newProfile, error: insertError } = await service
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        tier: "free",
        license_key: defaultLicense,
        credits_included: 50,
        credits_used: 0,
      })
      .select("email, full_name, tier, license_key, credits_included, credits_used, credits_reset_at, stripe_customer_id")
      .single();

    if (!insertError && newProfile) {
      profile = newProfile;
    }
  }

  // ৩. যদি তখনও কোনো কারণে প্রোফাইল না পাওয়া যায়, তবে সেফ ফলব্যাক অবজেক্ট ব্যবহার করা যাতে পেজ ক্র্যাশ না করে
  const safeProfile = profile || {
    email: user.email || "user@flowsaas.com",
    full_name: user.email?.split("@")[0] || "User",
    tier: "free" as const,
    license_key: "FSK-DEMO-KEY-1234",
    credits_included: 50,
    credits_used: 0,
    credits_reset_at: new Date().toISOString(),
    stripe_customer_id: null,
  };

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("current_period_end, trial_end, status")
    .eq("user_id", user.id)
    .maybeSingle();

  const serviceClient = createServiceClient();
  const usageDays = await getUsageDaily(serviceClient, user.id, 14);
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

  const renewsAt = subscription?.status === "trialing" ? subscription.trial_end : subscription?.current_period_end;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h3 text-ink">Overview</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <KeyMetricCard creditsUsed={safeProfile.credits_used} creditsIncluded={safeProfile.credits_included} runsThisMonth={runsThisMonth} resetsAt={safeProfile.credits_reset_at} />
        </div>
        <div className="lg:col-span-5">
          <AccountInfoCard
            email={safeProfile.email}
            fullName={safeProfile.full_name}
            tier={safeProfile.tier as "free" | "vip" | "enterprise"}
            licenseKey={safeProfile.license_key}
            renewsAt={renewsAt ?? null}
            hasStripeCustomer={Boolean(safeProfile.stripe_customer_id)}
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