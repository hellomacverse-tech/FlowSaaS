import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ManageBillingButton } from "@/components/dashboard/ManageBillingButton";

export const metadata = { robots: { index: false, follow: false } };

export default async function BillingPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/billing");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, stripe_customer_id, credits_included, credits_used")
    .eq("id", user.id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, trial_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div>
      <h1 className="text-h3 text-ink">Billing</h1>

      <Card className="mt-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Current plan</p>
            <p className="text-lg font-semibold capitalize text-ink">{profile?.tier ?? "free"}</p>
          </div>
          <Badge tone={profile?.tier === "vip" ? "violet" : "slate"} className="capitalize">
            {profile?.tier ?? "free"}
          </Badge>
        </div>

        {subscription ? (
          <p className="mt-3 text-sm text-ink-2">
            {subscription.status === "trialing" && subscription.trial_end
              ? `Trial ends ${new Date(subscription.trial_end).toLocaleDateString()}`
              : subscription.current_period_end
                ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
                : null}
            {subscription.cancel_at_period_end ? " · Cancels at period end" : null}
          </p>
        ) : null}

        <p className="mt-3 text-sm text-ink-2">
          {profile?.credits_used ?? 0} / {profile?.credits_included ?? 50} Micro-SaaS credits used this month
        </p>

        <div className="mt-5">
          <ManageBillingButton hasStripeCustomer={Boolean(profile?.stripe_customer_id)} />
        </div>
      </Card>
    </div>
  );
}
