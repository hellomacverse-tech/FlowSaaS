import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { PseoBreadcrumbs } from '@/components/seo/PseoBreadcrumbs';
import { getPublishedCaseStudies, getPublishedCaseStudy } from '@/lib/case-studies';
import { buildCaseStudyGraph } from '@/lib/schema/case-study';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { env } from '@/lib/env';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await getPublishedCaseStudies()).map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getPublishedCaseStudy(slug);
  if (!c) return { robots: { index: false } };
  return buildPageMetadata({
    title: c.title,
    description: c.challenge.slice(0, 155),
    path: `/case-studies/${slug}`,
    image: `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/og/case-studies/${slug}`,
  });
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const c = await getPublishedCaseStudy(slug); // only published + verified + non-seed rows are ever returned
  if (!c) notFound();
  const graph = buildCaseStudyGraph(c, env.NEXT_PUBLIC_SITE_URL);
  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      {graph ? <JsonLd data={graph} /> : null}
      <PseoBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Case studies', href: '/case-studies' }, { label: c.title }]} />
      <h1 className="font-display text-[length:var(--text-h1,2.5rem)] font-extrabold">{c.title}</h1>
      <p className="mt-2 text-muted">{c.client_name}{c.industry ? ` · ${c.industry}` : ''}</p>
      <section aria-labelledby="cs-challenge" className="mt-10"><h2 id="cs-challenge" className="font-display text-2xl font-bold">Challenge</h2><p className="mt-2 text-ink-2">{c.challenge}</p></section>
      <section aria-labelledby="cs-solution" className="mt-10"><h2 id="cs-solution" className="font-display text-2xl font-bold">Solution</h2><p className="mt-2 text-ink-2">{c.solution}</p></section>
      <section aria-labelledby="cs-results" className="mt-10">
        <h2 id="cs-results" className="font-display text-2xl font-bold">Results</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {c.results.map((r) => (
            <div key={r.label} className="rounded-2xl border border-line/70 bg-white p-5 shadow-sm">
              <dt className="text-sm text-muted">{r.label}</dt>
              <dd className="font-display text-2xl font-extrabold">{r.value}</dd>
              <dd className="mt-1 text-xs text-muted">Source: {r.source}</dd>
            </div>
          ))}
        </dl>
      </section>
      {c.quote ? <blockquote className="mt-10 border-l-4 border-teal-500 pl-4 text-lg text-ink-2">{c.quote}</blockquote> : null}
    </main>
  );
}
