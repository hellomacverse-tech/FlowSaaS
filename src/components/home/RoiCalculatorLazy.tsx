'use client';
import type { ReactNode } from 'react';
import { Deferred, pickComponent } from '@/components/ui/Deferred';

const load = () => import('./RoiCalculator').then((m) => pickComponent<{ variant: 'home' | 'page' }>(m as Record<string, unknown>, 'RoiCalculator'));

/** Render on the server with a static fallback (the default headline) so the text exists in HTML for SEO and no-JS. */
export function RoiCalculatorLazy({ fallback }: { fallback: ReactNode }) {
  return <Deferred load={load} props={{ variant: 'home' as const }} fallback={fallback} minHeight={520} />;
}
