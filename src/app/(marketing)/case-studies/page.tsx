import type { Metadata } from 'next';
import { getPublishedCaseStudies } from '@/lib/case-studies';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const items = await getPublishedCaseStudies();
  return buildPageMetadata({
    title: 'Customer Case Studies',
    description: 'Verified results from teams that automated repetitive work with FlowSaaS n8n workflows.',
    path: '/case-studies',
    robots: items.length ? undefined : { index: false, follow: true },
  });
}

export default async function CaseStudiesPage() {
  const items = await getPublishedCaseStudies();
  return (
    <main id="main" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <h1 className="font-display text-[length:var(--text-h1,2.5rem)] font-extrabold">Customer Case Studies</h1>
      {items.length === 0 ? (
        <p className="mt-6 max-w-[68ch] text-lg text-ink-2">Case studies are coming soon. We publish only results our customers have confirmed.</p>
      ) : (
        <ul className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <li key={c.slug} className="rounded-2xl border border-line/70 bg-white p-6 shadow-sm">
              {c.industry ? <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]">{c.industry}</span> : null}
              <h2 className="mt-3 text-xl font-semibold"><a className="hover:underline" href={`/case-studies/${c.slug}`}>{c.title}</a></h2>
              <ul className="mt-3 space-y-1 text-sm text-ink-2">{c.results.slice(0, 3).map((r) => <li key={r.label}>{r.label}: {r.value}</li>)}</ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
