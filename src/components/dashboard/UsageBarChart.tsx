"use client";

import { useState } from "react";
import type { UsageDay } from "@/lib/dashboard/usage";

const CHART_HEIGHT = 160;
const BAR_GAP_RATIO = 0.35;

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}
function formatFullDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * Daily executions bar chart (Section 9.5): rounded-top bars, a
 * teal→violet gradient fill, today's bar always at full height, a small
 * coral dot above any bar with a failure, and at most 3 dotted reference
 * lines rather than a dense grid. No charting library — plain SVG, so the
 * bundle stays small. A visually-hidden `<table>` carries the same data for
 * screen readers (the SVG itself has no accessible per-bar structure).
 */
export function UsageBarChart({ days, height = CHART_HEIGHT }: { days: UsageDay[]; height?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.executions));
  const todayIso = new Date().toISOString().slice(0, 10);

  const barCount = days.length;
  const barWidth = 100 / barCount / (1 + BAR_GAP_RATIO);
  const gap = barWidth * BAR_GAP_RATIO;

  const gridLines = [0, 0.5, 1];

  return (
    <div className="relative">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-40 w-full overflow-visible" role="img" aria-label="Daily tool executions">
        {gridLines.map((fraction) => (
          <line key={fraction} x1={0} x2={100} y1={height - fraction * (height - 20)} y2={height - fraction * (height - 20)} stroke="var(--color-line)" strokeOpacity={0.6} strokeDasharray="2 3" strokeWidth={0.5} />
        ))}

        <defs>
          <linearGradient id="usage-bar-gradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.55} />
          </linearGradient>
        </defs>

        {days.map((d, i) => {
          const isToday = d.day === todayIso;
          const barHeightFraction = isToday ? 1 : d.executions / max;
          const barHeight = Math.max(2, barHeightFraction * (height - 20));
          const x = i * (barWidth + gap);
          const y = height - barHeight;
          const isHovered = hovered === i;

          return (
            <g key={d.day} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
              <rect x={x} y={0} width={barWidth + gap} height={height} fill="transparent" />
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={barWidth / 2} fill="url(#usage-bar-gradient)" opacity={isHovered ? 1 : 0.85} />
              {d.failures > 0 ? <circle cx={x + barWidth / 2} cy={y - 4} r={1.6} fill="#e5484d" /> : null}
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex text-[10px] text-muted" style={{ gap: `${gap}%` }}>
        {days.map((d, i) => (
          <div key={d.day} style={{ width: `${barWidth}%` }} className="truncate text-center">
            {barCount <= 14 || i % Math.ceil(barCount / 10) === 0 ? formatDayLabel(d.day) : ""}
          </div>
        ))}
      </div>

      {hovered !== null ? (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-md">
          {formatFullDate(days[hovered]!.day)} · {days[hovered]!.executions} executions
          {days[hovered]!.failures > 0 ? ` · ${days[hovered]!.failures} failed` : ""}
        </div>
      ) : null}

      <table className="sr-only">
        <caption>Daily tool executions and failures</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Executions</th>
            <th scope="col">Credits used</th>
            <th scope="col">Failures</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <td>{d.day}</td>
              <td>{d.executions}</td>
              <td>{d.credits}</td>
              <td>{d.failures}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
