export interface Crumb {
  label: string;
  href?: string;
}

export function PseoBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((c, i) => (
          <li key={c.label} className="flex items-center gap-2">
            {c.href ? <a href={c.href} className="hover:text-ink focus-visible:ring-2 focus-visible:ring-violet-500">{c.label}</a> : <span aria-current="page" className="text-ink-2">{c.label}</span>}
            {i < items.length - 1 ? <span aria-hidden="true">›</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
