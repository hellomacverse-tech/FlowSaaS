import type { MetadataRoute } from 'next';
import { catalogSeed } from '@/data/catalog-seed';
import { getPublishedCaseStudies } from '@/lib/case-studies';
import { SITEMAP_CHUNK, dynamicChunkCount, dynamicSitemapEntries, siteBaseUrl } from '@/lib/pseo/sitemap-entries';

const CATEGORY_SLUGS = ['facebook-crm', 'lead-generation', 'social-media', 'e-commerce', 'ai-llm'] as const;
const STATIC_PAGES = ['/', '/workflows', '/services', '/pricing', '/enterprise', '/roi-calculator', '/tools', '/integrations', '/privacy', '/terms', '/refunds', '/security'] as const;

/** id 0 = static + categories + workflows + case studies. ids 1..n = pair pages and app hubs. */
export async function generateSitemaps(): Promise<{ id: number }[]> {
  const n = await dynamicChunkCount();
  return Array.from({ length: n + 1 }, (_, i) => ({ id: i }));
}

export default async function sitemap(props: {
  id: number | string | Promise<number | string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const SITE = siteBaseUrl();
  if (id > 0) return (await dynamicSitemapEntries()).slice((id - 1) * SITEMAP_CHUNK, id * SITEMAP_CHUNK);

  // lastModified is omitted for hand-written pages rather than faked; only DB rows with real dates carry one.
  const staticPages = STATIC_PAGES.map((p) => ({
    url: `${SITE}${p === '/' ? '' : p}`, changeFrequency: 'weekly' as const, priority: p === '/' ? 1 : 0.8,
  }));
  const cats = CATEGORY_SLUGS.map((c) => ({ url: `${SITE}/categories/${c}`, changeFrequency: 'weekly' as const, priority: 0.7 }));
  const workflows = (catalogSeed as unknown as readonly { slug: string; updatedAt: string }[]).map((w) => ({
    url: `${SITE}/workflows/${w.slug}`, lastModified: new Date(w.updatedAt), changeFrequency: 'weekly' as const, priority: 0.9,
  }));
  const cases = (await getPublishedCaseStudies()).map((c) => ({
    url: `${SITE}/case-studies/${c.slug}`, lastModified: new Date(c.updated_at), changeFrequency: 'monthly' as const, priority: 0.5,
  }));
  return [...staticPages, ...cats, ...workflows, ...cases];
}
