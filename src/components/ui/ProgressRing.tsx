import { useId } from "react";
import { cn } from "@/lib/cn";

interface ProgressRingProps {
  /** 0–100. */
  value: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  /** Content rendered in the center of the ring (e.g. "72%"). */
  children?: React.ReactNode;
  className?: string;
  /** Gradient stops for the progress stroke. Defaults to the brand teal→violet flow gradient. */
  colorFrom?: string;
  colorTo?: string;
}

/**
 * SVG progress ring with a gradient stroke, `stroke-linecap: round`,
 * starting at 12 o'clock. Used by the credits ring (Section 9.5) and the
 * sandbox run viewer (Section 9.1.3). `role="progressbar"` carries the
 * accessible value so screen readers announce it without needing the
 * visual gradient. The gradient's `<linearGradient id>` is generated with
 * `useId()` rather than hard-coded, so two rings can render on the same
 * page (e.g. a credits ring plus a sandbox ring) without one's `<defs>`
 * silently overriding the other's.
 */
export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  children,
  className,
  colorFrom = "#14b8a6",
  colorTo = "#8b5cf6",
}: ProgressRingProps) {
  const gradientId = `progress-ring-gradient-${useId()}`;
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90 motion-reduce:transition-none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorFrom} />
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
