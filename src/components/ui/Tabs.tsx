"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  /** Uncontrolled default tab id. Ignored once the hash matches a tab. */
  defaultTabId?: string;
  /** When true, keeps the active tab in the URL hash (e.g. #how-it-works) and reads it on mount. */
  syncHash?: boolean;
  className?: string;
}

/**
 * Roving-tabindex ARIA tabs (Section 3.8): arrow keys move focus between
 * tabs, Home/End jump to the first/last, and every panel stays mounted in
 * the DOM (just `hidden`) rather than being unmounted when inactive, so
 * deep content like the Nodes table or transcript is still there for
 * crawlers and for `#hash` deep links (Section 9.3: "hash-synced").
 */
export function Tabs({ items, defaultTabId, syncHash = false, className }: TabsProps) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(defaultTabId ?? items[0]?.id ?? "");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!syncHash) return;
    const hash = window.location.hash.replace("#", "");
    if (hash && items.some((item) => item.id === hash)) {
      setActiveId(hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once on mount
  }, [syncHash]);

  function activate(id: string) {
    setActiveId(id);
    if (syncHash) {
      window.history.replaceState(null, "", `#${id}`);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      const next = items[nextIndex];
      if (next) {
        activate(next.id);
        tabRefs.current[next.id]?.focus();
      }
    }
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label="Workflow details" className="flex gap-1 overflow-x-auto border-b border-line/70">
        {items.map((item, index) => {
          const isActive = item.id === activeId;
          const tabId = `${baseId}-tab-${item.id}`;
          const panelId = `${baseId}-panel-${item.id}`;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[item.id] = el;
              }}
              id={tabId}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => activate(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "whitespace-nowrap px-4 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                isActive ? "border-b-2 border-violet-500 text-ink" : "text-muted hover:text-ink-2",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {items.map((item) => {
        const tabId = `${baseId}-tab-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;
        const isActive = item.id === activeId;
        return (
          <div
            key={item.id}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!isActive}
            className="pt-6"
          >
            {item.content}
          </div>
        );
      })}
    </div>
  );
}
