'use client';
import type { ReactNode } from 'react';
import { Deferred, pickComponent } from '@/components/ui/Deferred';

const load = () => import('./LiveSandbox').then((m) => pickComponent<Record<string, never>>(m as Record<string, unknown>, 'LiveSandbox'));

/** Fallback should be the server-rendered idle-state card at the same height (min-height 640). */
export function LiveSandboxLazy({ fallback }: { fallback: ReactNode }) {
  return <Deferred load={load} props={{}} fallback={fallback} minHeight={640} />;
}
