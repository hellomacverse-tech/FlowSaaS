"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { TrendingUp, Clock, DollarSign, Zap } from "lucide-react";

export default function RoiCalculatorPage() {
  const [teamSize, setTeamSize] = useState<number>(10);
  const [hoursSpent, setHoursSpent] = useState<number>(15);
  const [hourlyRate, setHourlyRate] = useState<number>(35);

  // Calculations (Assuming 75% automation efficiency)
  const monthlyHoursSaved = Math.round(teamSize * hoursSpent * 4.33 * 0.75);
  const monthlyMoneySaved = Math.round(monthlyHoursSaved * hourlyRate);
  const annualSavings = monthlyMoneySaved * 12;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-600">
          ROI CALCULATOR
        </span>
        <h1 className="mt-2 text-4xl font-extrabold text-ink tracking-tight sm:text-5xl">
          See what automation is worth to your team
        </h1>
        <p className="mt-4 text-lg text-muted">
          Move the sliders below to calculate your estimated monthly time and cost savings with FlowSaaS automation workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Sliders Control Panel */}
        <Card className="lg:col-span-7 p-6 sm:p-8 space-y-6 bg-surface/50 backdrop-blur-sm border border-slate-100 shadow-sm rounded-2xl">
          <h3 className="text-xl font-bold text-ink flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-600" />
            Configure Your Team Metrics
          </h3>

          {/* Slider 1: Team Size */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted">Team members handling repetitive tasks</span>
              <span className="text-ink font-semibold">{teamSize} people</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="w-full accent-violet-600 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>1 person</span>
              <span>100+ people</span>
            </div>
          </div>

          {/* Slider 2: Hours Spent */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted">Hours spent per week on manual workflows</span>
              <span className="text-ink font-semibold">{hoursSpent} hrs / week</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(Number(e.target.value))}
              className="w-full accent-violet-600 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>5 hrs</span>
              <span>40 hrs</span>
            </div>
          </div>

          {/* Slider 3: Hourly Rate */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted">Average hourly cost per employee</span>
              <span className="text-ink font-semibold">${hourlyRate} / hr</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full accent-violet-600 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>$10/hr</span>
              <span>$150/hr</span>
            </div>
          </div>
        </Card>

        {/* Results Display Card */}
        <Card className="lg:col-span-5 p-6 sm:p-8 bg-gradient-to-br from-violet-900 via-slate-900 to-slate-950 text-white shadow-xl rounded-2xl flex flex-col justify-between space-y-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold tracking-wider uppercase">
              Estimated ROI Impact
            </span>
            <h4 className="mt-4 text-2xl font-bold tracking-tight">Your Automation Return</h4>
            <p className="text-slate-400 text-sm mt-1">Based on 75% average workflow automation efficiency.</p>
          </div>

          <div className="space-y-4 py-4 border-y border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 text-violet-400">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-sm text-slate-300">Hours Saved / Month</span>
              </div>
              <span className="text-xl font-bold text-white">{monthlyHoursSaved.toLocaleString()} hrs</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 text-teal-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-sm text-slate-300">Monthly Cost Savings</span>
              </div>
              <span className="text-xl font-bold text-teal-300">${monthlyMoneySaved.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-600 text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-base font-semibold text-white">Annual Savings</span>
              </div>
              <span className="text-2xl font-extrabold text-violet-300">${annualSavings.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold shadow-lg">
              <Link href="/signup">Claim Your ROI — Get Started</Link>
            </Button>
            <p className="text-center text-xs text-slate-400">No commitment required. Ready-to-deploy n8n templates.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}