'use client';
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';

type Loader<P extends object> = () => Promise<{ default: ComponentType<P> }>;

interface DeferredProps<P extends object> {
  load: Loader<P>;
  props: P;
  /** Server-renderable, same dimensions as the island, so there is no layout shift. */
  fallback: ReactNode;
  minHeight: number;
  rootMargin?: string;
}

/**
 * Mounts a heavy island only when it nears the viewport or on first interaction.
 * A plain next/dynamic does not shrink first-load JS; this does.
 */
export function Deferred<P extends object>({ load, props, fallback, minHeight, rootMargin = '300px' }: DeferredProps<P>) {
  const host = useRef<HTMLDivElement>(null);
  const [Comp, setComp] = useState<ComponentType<P> | null>(null);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    load()
      .then((m) => setComp(() => m.default))
      .catch(() => {
        started.current = false;
        setFailed(true);
      });
  }, [load]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      start();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, start]);

  return (
    <div ref={host} style={{ minHeight }} onPointerEnter={start} onFocusCapture={start}>
      {Comp ? (
        <Comp {...props} />
      ) : failed ? (
        <button
          type="button"
          className="rounded-xl border border-line px-4 py-2 focus-visible:ring-2 focus-visible:ring-violet-500"
          onClick={() => {
            setFailed(false);
            start();
          }}
        >
          Couldn’t load this section. Retry
        </button>
      ) : (
        fallback
      )}
    </div>
  );
}

/** Accepts a module that exposes the component as `default` or as a named export. */
export function pickComponent<P extends object>(mod: Record<string, unknown>, named: string): { default: ComponentType<P> } {
  const c = (mod.default ?? mod[named]) as ComponentType<P> | undefined;
  if (!c) throw new Error(`Module has neither a default export nor "${named}"`);
  return { default: c };
}
