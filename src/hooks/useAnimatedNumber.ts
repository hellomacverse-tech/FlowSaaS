"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tweens a displayed number toward `value` over `durationMs` using
 * requestAnimationFrame, easing with the same out-expo-ish curve used for
 * scroll reveals (Section 3.7). Renders the true final value immediately
 * under `prefers-reduced-motion`.
 */
export function useAnimatedNumber(value: number, durationMs = 350): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const to = value;
    const start = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // out-expo-ish ease, matching --ease-enter
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const current = from + (to - from) * eased;
      setDisplay(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `durationMs` is treated as static per call site
  }, [value]);

  return display;
}
