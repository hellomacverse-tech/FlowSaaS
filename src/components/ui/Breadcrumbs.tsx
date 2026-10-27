import Link from "next/link";
import type { Route } from "next";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: Route;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {i > 0 ? <ChevronRight aria-hidden="true" size={13} /> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-ink-2">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink-2">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
