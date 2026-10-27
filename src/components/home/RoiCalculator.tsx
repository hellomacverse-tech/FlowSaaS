"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { GradientSpheres } from "@/components/layout/GradientSpheres";
import { calculateRoi } from "@/lib/roi";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { cn } from "@/lib/cn";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

interface RoiCalculatorProps {
  variant?: "home" | "page";
}

export function RoiCalculator({ variant = "home" }: RoiCalculatorProps) {
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [hourlyCost, setHourlyCost] = useState(25);
  const [coveragePercent, setCoveragePercent] = useState(100);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Mirror state in the URL (?hours=&rate=&coverage=) without triggering a
  // navigation, so the result is shareable (Section 9.6).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const h = Number(params.get("hours"));
    const r = Number(params.get("rate"));
    const c = Number(params.get("coverage"));
    if (h >= 1 && h <= 80) setHoursPerWeek(h);
    if (r >= 5 && r <= 150) setHourlyCost(r);
    if (c >= 20 && c <= 100) setCoveragePercent(c);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    params.set("hours", String(hoursPerWeek));
    params.set("rate", String(hourlyCost));
    params.set("coverage", String(coveragePercent));
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [hoursPerWeek, hourlyCost, coveragePercent, hydrated]);

  const result = calculateRoi({ hoursPerWeek, hourlyCost, coverage: coveragePercent / 100 });
  const animatedSavings = useAnimatedNumber(result.monthlySavings);
  const animatedHours = useAnimatedNumber(result.monthlyHours);

  function copyLink() {
    if (typeof window !== "undefined") {
      void navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <Card className="relative overflow-hidden p-6 sm:p-8">
      <GradientSpheres variant="accent" color="coral" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Slider
            label="Hours spent on manual messaging/data entry per week"
            value={hoursPerWeek}
            min={1}
            max={80}
            unit="hrs"
            onChange={setHoursPerWeek}
          />
          <Slider
            label="Average hourly team cost"
            value={hourlyCost}
            min={5}
            max={150}
            unit="/hr"
            onChange={setHourlyCost}
          />

          <div className="border-t border-line/70 pt-4">
            <button
              type="button"
              onClick={() => setAdvancedOpen((open) => !open)}
              aria-expanded={advancedOpen}
              aria-controls="roi-advanced"
              className="flex items-center gap-1.5 text-sm font-medium text-violet-600"
            >
              Adjust assumptions
              <ChevronDown
                aria-hidden="true"
                size={16}
                className={cn("transition-transform duration-200", advancedOpen && "rotate-180")}
              />
            </button>
            {advancedOpen ? (
              <div id="roi-advanced" className="mt-4">
                <Slider
                  label="Automation coverage"
                  value={coveragePercent}
                  min={20}
                  max={100}
                  unit="%"
                  onChange={setCoveragePercent}
                />
                <p className="mt-2 text-xs text-muted">
                  Estimates assume the task is fully automated. Lower this for a conservative figure.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div aria-live="polite" className="flex flex-col justify-center rounded-2xl bg-surface p-6 text-center">
          <p className="text-h3 text-ink">
            FlowSaaS Automations will save you{" "}
            <span className="text-gradient tabular-nums">
              {currencyFormatter.format(Math.round(animatedSavings))}/month
            </span>{" "}
            and <span className="text-gradient tabular-nums">{numberFormatter.format(Math.round(animatedHours))} working hours</span>!
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-ink-2 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-3 shadow-xs">
              <p className="text-lg font-bold text-ink tabular-nums">{result.workdaysPerMonth.toFixed(0)}</p>
              <p className="text-xs text-muted">workdays back / month</p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-xs">
              <p className="text-lg font-bold text-ink tabular-nums">
                {currencyFormatter.format(Math.round(result.annualSavings))}
              </p>
              <p className="text-xs text-muted">per year</p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-xs">
              <p className="text-lg font-bold text-ink tabular-nums">
                {result.vipPaybackDays <= 1 ? "< 1 day" : `${result.vipPaybackDays} days`}
              </p>
              <p className="text-xs text-muted">VIP Pass payback</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild size="md">
              <Link href="/workflows">See workflows that fit</Link>
            </Button>
            <Button asChild variant="secondary-outline" size="md">
              <Link href="/services#quote">Get a custom estimate</Link>
            </Button>
          </div>
          {variant === "page" ? (
            <button
              type="button"
              onClick={copyLink}
              className="mt-3 text-xs font-medium text-violet-600 hover:underline"
            >
              Copy link to this estimate
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
