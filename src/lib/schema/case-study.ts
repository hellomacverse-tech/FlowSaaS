import type { CaseStudyRow } from '@/lib/case-studies';
import { siteBase, type JsonLdGraph } from './types';

/** Article schema only for verified, non-seed case studies. Anything else returns null. */
export function buildCaseStudyGraph(
  c: Pick<CaseStudyRow, 'slug' | 'title' | 'challenge' | 'verified' | 'is_seed' | 'published_at' | 'updated_at'>,
  siteUrl: string,
): JsonLdGraph | null {
  if (!c.verified || c.is_seed) return null;
  const site = siteBase(siteUrl);
  const url = `${site}/case-studies/${c.slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', '@id': `${url}#article`, headline: c.title.slice(0, 110), description: c.challenge,
        url, mainEntityOfPage: url,
        author: { '@id': `${site}/#organization` }, publisher: { '@id': `${site}/#organization` },
        datePublished: c.published_at ?? undefined, dateModified: c.updated_at,
        image: [`${site}/og/case-studies/${c.slug}`],
      },
    ],
  };
}
