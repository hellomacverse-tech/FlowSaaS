import type { RelatedPair } from '@/lib/pseo/view-model';

/** Workflow page → pSEO pair edge. Renders nothing when no indexable pair applies. */
export function WorksWith({ pairs }: { pairs: RelatedPair[] }) {
  if (pairs.length === 0) return null;
  return (
    <section aria-labelledby="works-with" className="mt-12">
      <h2 id="works-with" className="font-display text-2xl font-bold">Works with</h2>
      <ul className="mt-4 flex flex-wrap gap-3">
        {pairs.map((p) => (
          <li key={p.slug}>
            <a className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4 hover:bg-surface focus-visible:ring-2 focus-visible:ring-violet-500" href={`/integrations/${p.slug}`}>
              {p.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
