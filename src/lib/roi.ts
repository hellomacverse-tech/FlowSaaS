export interface RoiInputs {
  /** Hours spent on manual work per week. Range 1–80. */
  hoursPerWeek: number;
  /** Average hourly team cost in the selected currency. Range 5–150. */
  hourlyCost: number;
  /** Automation coverage, 0–1 (UI slider is 20–100%). Default 1. */
  coverage?: number;
}

export interface RoiResult {
  monthlyHours: number;
  monthlySavings: number;
  annualSavings: number;
  workdaysPerMonth: number;
  /** Days until the $29/mo VIP Pass pays for itself, minimum 1. */
  vipPaybackDays: number;
}

const WEEKS_PER_MONTH = 4;
const WORKDAY_HOURS = 8;
const VIP_MONTHLY_PRICE = 29;
const DAYS_PER_MONTH = 30;

/**
 * Exact formula from Section 9.6. With the documented defaults
 * (hoursPerWeek: 20, hourlyCost: 25, coverage: 1) this must resolve to
 * monthlyHours = 80 and monthlySavings = 2000 — enforced by
 * tests/unit/roi.test.ts per the Section 15.4 testing requirement.
 */
export function calculateRoi({ hoursPerWeek, hourlyCost, coverage = 1 }: RoiInputs): RoiResult {
  const monthlyHours = hoursPerWeek * WEEKS_PER_MONTH * coverage;
  const monthlySavings = monthlyHours * hourlyCost;
  const annualSavings = monthlySavings * 12;
  const workdaysPerMonth = monthlyHours / WORKDAY_HOURS;

  const dailySavings = monthlySavings / DAYS_PER_MONTH;
  const vipPaybackDays =
    dailySavings > 0 ? Math.max(1, Math.ceil(VIP_MONTHLY_PRICE / dailySavings)) : Infinity;

  return { monthlyHours, monthlySavings, annualSavings, workdaysPerMonth, vipPaybackDays };
}
