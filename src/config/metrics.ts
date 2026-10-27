export interface HeroMetric {
  value: string;
  label: string;
  /** Where this number comes from — required so the claim is never invented. */
  substantiation: string;
  /** ISO date the number was last checked against real data. */
  lastVerifiedAt: string;
}

/**
 * Home page metrics band (Section 9.1.2). These are launch copy and MUST be
 * backed by real, checkable data before production traffic sees them
 * (Section 16, rule 1). `checkMetricsFreshness()` below is called from the
 * build script and warns — rather than silently shipping stale numbers — if
 * any metric is missing a substantiation or was last verified more than 90
 * days ago.
 */
export const heroMetrics: HeroMetric[] = [
  {
    value: "10,000+",
    label: "Hours Saved for Clients",
    substantiation:
      "Sum of workflows.roi_hours_per_week × active install count, pulled quarterly from usage_daily.",
    lastVerifiedAt: "2026-09-01",
  },
  {
    value: "99.9%",
    label: "Execution Reliability",
    substantiation:
      "tool_runs succeeded / (succeeded + failed) over the trailing 90 days, excluding sandbox_runs.",
    lastVerifiedAt: "2026-09-01",
  },
  {
    value: "$500k+",
    label: "Operational Costs Reduced",
    substantiation:
      "Hours Saved × the blended hourly rate reported in DFY discovery calls and quote-form submissions.",
    lastVerifiedAt: "2026-09-01",
  },
];

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Called from CI (Section 16.1c) to fail loudly rather than let a stale or
 * unsubstantiated headline number reach production.
 */
export function checkMetricsFreshness(now: Date = new Date()): string[] {
  const warnings: string[] = [];

  for (const metric of heroMetrics) {
    if (!metric.substantiation.trim()) {
      warnings.push(`Metric "${metric.label}" has no substantiation.`);
      continue;
    }
    const verifiedAt = new Date(metric.lastVerifiedAt);
    if (Number.isNaN(verifiedAt.getTime())) {
      warnings.push(`Metric "${metric.label}" has an invalid lastVerifiedAt date.`);
      continue;
    }
    if (now.getTime() - verifiedAt.getTime() > NINETY_DAYS_MS) {
      warnings.push(
        `Metric "${metric.label}" was last verified on ${metric.lastVerifiedAt}, more than 90 days ago.`,
      );
    }
  }

  return warnings;
}
