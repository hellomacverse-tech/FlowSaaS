import { describe, expect, it } from "vitest";
import { calculateRoi } from "@/lib/roi";

describe("calculateRoi", () => {
  it("resolves the documented defaults to 80 working hours and $2,000/month", () => {
    const result = calculateRoi({ hoursPerWeek: 20, hourlyCost: 25 });

    expect(result.monthlyHours).toBe(80);
    expect(result.monthlySavings).toBe(2000);
    expect(result.annualSavings).toBe(24000);
    expect(result.workdaysPerMonth).toBe(10);
  });

  it("scales linearly with hours and rate", () => {
    const result = calculateRoi({ hoursPerWeek: 40, hourlyCost: 50 });

    expect(result.monthlyHours).toBe(160);
    expect(result.monthlySavings).toBe(8000);
  });

  it("applies automation coverage below 100%", () => {
    const result = calculateRoi({ hoursPerWeek: 20, hourlyCost: 25, coverage: 0.5 });

    expect(result.monthlyHours).toBe(40);
    expect(result.monthlySavings).toBe(1000);
  });

  it("computes VIP payback in days, minimum 1", () => {
    const bigSaver = calculateRoi({ hoursPerWeek: 20, hourlyCost: 25 });
    expect(bigSaver.vipPaybackDays).toBeLessThanOrEqual(1);

    const smallSaver = calculateRoi({ hoursPerWeek: 1, hourlyCost: 5 });
    expect(smallSaver.vipPaybackDays).toBeGreaterThan(1);
  });
});
