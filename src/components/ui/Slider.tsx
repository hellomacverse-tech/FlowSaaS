"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

/**
 * A native `<input type="range">` (arrow keys, Home/End, and Page Up/Down
 * are built in) styled to the design system, paired with a clamped numeric
 * input for direct entry — both bound to the same value (Section 9.6).
 */
export function Slider({ label, value, min, max, step = 1, unit, onChange, className }: SliderProps) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;

  function handleNumberChange(raw: string) {
    if (raw === "") return;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    onChange(Math.min(max, Math.max(min, parsed)));
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink-2">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => handleNumberChange(event.target.value)}
            className="w-16 rounded-lg border border-line/70 px-2 py-1 text-right text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label={`${label} (exact value)`}
          />
          {unit ? <span className="text-sm text-muted">{unit}</span> : null}
        </div>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="slider-track h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        style={{
          background: `linear-gradient(90deg, #14b8a6 0%, #8b5cf6 ${percent}%, var(--color-surface-2) ${percent}%, var(--color-surface-2) 100%)`,
        }}
      />
    </div>
  );
}
