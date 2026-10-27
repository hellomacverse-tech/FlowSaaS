'use client';
import { useReportWebVitals } from 'next/web-vitals';
import { track } from '@/lib/analytics';

const WANTED = new Set(['LCP', 'INP', 'CLS', 'TTFB']);

/** Add `web_vital` { name, value, rating } to the discriminated event union in lib/analytics.ts. Consent-gated by track(). */
export function WebVitals() {
  useReportWebVitals((m) => {
    if (!WANTED.has(m.name)) return;
    track('web_vital', { name: m.name, value: Math.round(m.name === 'CLS' ? m.value * 1000 : m.value), rating: m.rating });
  });
  return null;
}
