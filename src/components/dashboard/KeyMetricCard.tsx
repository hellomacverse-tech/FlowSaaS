import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";

/**
 * Credits ring (Section 9.5): color and messaging shift at 80% and 95% used
 * — amber "running low" past 80%, coral + an upgrade nudge past 95%, since a
 * free-tier user who runs out mid-task should see this coming, not just hit
 * a 402 on their next tool run.
 */
export function KeyMetricCard({
  creditsUsed,
  creditsIncluded,
  runsThisMonth,
  resetsAt,
}: {
  creditsUsed: number;
  creditsIncluded: number;
  runsThisMonth: number;
  resetsAt: string;
}) {
  const remaining = Math.max(0, creditsIncluded - creditsUsed);
  const percentUsed = creditsIncluded > 0 ? Math.min(100, Math.round((creditsUsed / creditsIncluded) * 100)) : 0;
  const severe = percentUsed >= 95;
  const warning = percentUsed >= 80;
  const colors = severe ? { from: "#e5484d", to: "#ff8e8e" } : warning ? { from: "#f59e0b", to: "#fbbf24" } : { from: "#14b8a6", to: "#8b5cf6" };

  return (
    <Card className="flex h-full flex-col gap-6 p-6 sm:flex-row sm:items-center">
      <ProgressRing value={percentUsed} size={168} strokeWidth={14} label="Credits used" colorFrom={colors.from} colorTo={colors.to}>
        <span className="text-4xl font-extrabold text-ink">{percentUsed}%</span>
      </ProgressRing>

      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">API Usage / Credits</p>
        <p className="mt-1 text-sm text-ink-2">
          {creditsUsed} / {creditsIncluded} credits
        </p>
        <p className="mt-3 text-sm text-ink-2">{remaining} credits remaining</p>
        <p className="text-sm text-muted">Resets on {new Date(resetsAt).toLocaleDateString()}</p>
        <p className="text-sm text-muted">Runs this month: {runsThisMonth}</p>

        {warning ? <p className="mt-2 text-sm font-medium text-warn">You&apos;re running low.</p> : null}
        {severe ? (
          <Button asChild size="sm" className="mt-2">
            <Link href="/pricing#vip">Upgrade</Link>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
