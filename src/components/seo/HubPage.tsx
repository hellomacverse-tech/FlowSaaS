import { JsonLd } from '@/components/seo/JsonLd';
import { PseoBreadcrumbs } from './PseoBreadcrumbs';
import { buildHubGraph } from '@/lib/schema/hub';
import type { HubContext } from '@/lib/pseo/context';
import Link from 'next/link';

const CARD = 'rounded-2xl border border-line/70 bg-white shadow-sm';
const H2 = 'font-display text-3xl font-bold';

export function HubPage({ ctx, siteUrl }: { ctx: HubContext; siteUrl: string }) {
  const { integration: i, pairs, workflows } = ctx;
  const indexable = pairs.filter((p) => p.indexable);
  
  return (
    <main id="main" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <JsonLd
        data={buildHubGraph(
          { slug: i.slug, name: i.name, description: i.description, indexablePairs: indexable.map((p) => ({ slug: p.pair.slug, label: `${i.name} to ${p.partner.name}` })) },
          siteUrl,
        ) as unknown as Record<string, unknown>}
      />
      <PseoBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Integrations', href: '/integrations' }, { label: i.name }]} />
      <h1 className="font-display text-[length:var(--text-h1,2.5rem)] font-extrabold">{i.name} Automation with n8n</h1>
      {i.description ? <p className="mt-4 max-w-[68ch] text-lg text-ink-2">{i.description}</p> : null}

      <section aria-labelledby="hub-workflows" className="mt-16">
        <h2 id="hub-workflows" className={H2}>Workflows that use {i.name}</h2>
        {workflows.length ? (
          <ul className="mt-6 grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
            {workflows.map((w) => (
              <li key={w.slug} className={`${CARD} p-6`}>
                <h3 className="text-lg font-semibold">
                  <Link className="hover:underline" href={`/workflows/${w.slug}` as any}>{w.title}</Link>
                </h3>
                <p className="mt-2 text-sm text-ink-2">{w.summary}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-ink-2">
            No ready-made workflow uses {i.name} yet. <Link className="underline" href="/services#quote">Request one</Link>.
          </p>
        )}
      </section>

      <section aria-labelledby="hub-pairs" className="mt-16">
        <h2 id="hub-pairs" className={H2}>{i.name} integration guides</h2>
        {pairs.length ? (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {pairs.map((p) => (
              <li key={p.pair.slug} className={`${CARD} p-5`}>
                <Link className="font-semibold hover:underline" href={`/integrations/${p.pair.slug}` as any}>
                  {p.pair.slug.startsWith(i.slug) ? `${i.name} to ${p.partner.name}` : `${p.partner.name} to ${i.name}`}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-ink-2">Integration guides for {i.name} are being written.</p>
        )}
      </section>

      <nav aria-label="Next steps" className="mt-16 flex flex-wrap gap-3">
        <Link className="inline-flex min-h-11 items-center rounded-xl bg-ink px-5 font-semibold text-white" href="/workflows">
          Browse all workflows
        </Link>
        <Link className="inline-flex min-h-11 items-center rounded-xl border border-ink/15 bg-white px-5 font-semibold text-ink" href="/services#book">
          Book a setup call
        </Link>
      </nav>
    </main>
  );
}