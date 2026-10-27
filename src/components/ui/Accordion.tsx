"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface AccordionItem {
  id: string;
  question: string;
  /** Rendered as plain text — callers pass already-safe copy, not raw HTML. */
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Item id open by default (Section 9.1.8: "first item open by default"). */
  defaultOpenId?: string | undefined;
  /** Allow more than one panel open at once. Default: single-open (like the home FAQ). */
  multiple?: boolean;
  className?: string;
}

/**
 * Every panel's text is always present in the DOM — closed panels use
 * `hidden="until-found"` rather than being unmounted, so search crawlers
 * and the FAQPage JSON-LD (which must match visible text 1:1, Section
 * 9.1.8) see the same content whether or not a visitor has expanded it.
 */
export function Accordion({ items, defaultOpenId, multiple = false, className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(defaultOpenId ? [defaultOpenId] : []),
  );
  const baseId = useId();

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(multiple ? prev : []);
      if (prev.has(id)) {
        if (multiple) next.delete(id);
        // single mode: re-deriving `next` as empty already closes it
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className={cn("divide-y divide-line/70", className)}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;

        return (
          <div key={item.id} id={`faq-${item.id}`}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                {item.question}
                <ChevronDown
                  aria-hidden="true"
                  size={18}
                  className={cn(
                    "shrink-0 text-muted transition-transform duration-200 motion-reduce:transition-none",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={isOpen ? undefined : ("until-found" as unknown as true)}
              className="pb-5 pr-8 text-sm leading-relaxed text-ink-2"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
