import 'server-only';
import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { catalogSeed } from '@/data/catalog-seed';
import { getAllPublishedPairs, getIntegrations, hubIsIndexable } from './resolve';
import type { CatalogEntry } from './build-context';

export const SITEMAP_CHUNK = 5000;
export const siteBaseUrl = (): string => env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

/** Single source for the sitemap children AND the sitemap index, so counts always agree. */
export async function dynamicSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const SITE = siteBaseUrl();
  const catalog = catalogSeed as unknown as readonly CatalogEntry[];
  const [pairs, integrations] = await Promise.all([getAllPublishedPairs(), getIntegrations()]);
  const wfCount = (slug: string): number => catalog.filter((w) => w.integrations.includes(slug)).length;
  const pairEntries = pairs
    .filter((p) => p.indexable && !p.redirect_to)
    .map((p) => ({ url: `${SITE}/integrations/${p.slug}`, lastModified: new Date(p.updated_at), changeFrequency: 'monthly' as const, priority: 0.6 }));
  const hubEntries = integrations
    .filter((i) => hubIsIndexable(i.id, pairs, wfCount(i.slug)))
    .map((i) => ({ url: `${SITE}/integrations/${i.slug}`, lastModified: new Date(i.updated_at), changeFrequency: 'weekly' as const, priority: 0.7 }));
  return [...pairEntries, ...hubEntries];
}

export async function dynamicChunkCount(): Promise<number> {
  return Math.max(1, Math.ceil((await dynamicSitemapEntries()).length / SITEMAP_CHUNK));
}
