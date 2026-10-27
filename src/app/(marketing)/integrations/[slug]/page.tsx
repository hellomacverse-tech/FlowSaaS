import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { resolveIntegrationSlug, getAllPublishedPairs, getIntegrations, hubIsIndexable } from '@/lib/pseo/resolve';
import { buildPairTitle, buildPairDescription } from '@/lib/pseo/meta';
import { shortName } from '@/config/integration-meta';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { env } from '@/lib/env';
import { PairPage } from '@/components/seo/PairPage';
import { HubPage } from '@/components/seo/HubPage';
import { loadPairContext, loadHubContext } from '@/lib/pseo/context';

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const [pairs, integrations] = await Promise.all([getAllPublishedPairs(), getIntegrations()]);
  return [
    ...pairs.filter((p) => p.indexable && !p.redirect_to).map((p) => ({ slug: p.slug })),
    ...integrations.map((i) => ({ slug: i.slug })),
  ];
}

type Props = { params: Promise<{ slug: string }> };
const site = (): string => env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolveIntegrationSlug(slug);
  if (r.kind === 'pair') {
    const a = { name: r.source.name, shortName: shortName(r.source.slug, r.source.name) };
    const b = { name: r.target.name, shortName: shortName(r.target.slug, r.target.name) };
    return buildPageMetadata({
      title: { absolute: r.pair.meta_title ?? buildPairTitle(a, b) },
      description: buildPairDescription(a, b, r.pair.meta_description),
      path: `/integrations/${slug}`,
      image: `${site()}/og/integrations/${slug}`,
      robots: r.pair.indexable ? undefined : { index: false, follow: true },
    });
  }
  if (r.kind === 'hub') {
    const [pairs, ctx] = await Promise.all([getAllPublishedPairs(), loadHubContext(r.integration)]);
    return buildPageMetadata({
      title: `${r.integration.name} Automation with n8n`,
      description: `Automate ${r.integration.name} with n8n: ready-made workflows and ${ctx.pairs.length} integration guides with field mapping and setup steps.`.slice(0, 155),
      path: `/integrations/${slug}`,
      image: `${site()}/og/integrations/${slug}`,
      robots: hubIsIndexable(r.integration.id, pairs, ctx.workflows.length) ? undefined : { index: false, follow: true },
    });
  }
  return { robots: { index: false } };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const r = await resolveIntegrationSlug(slug);
  if (r.kind === 'redirect') permanentRedirect(r.to as any); // 308: treated as permanent by search engines
  if (r.kind === 'notFound') notFound();
  if (r.kind === 'pair') return <PairPage vm={await loadPairContext(r)} siteUrl={env.NEXT_PUBLIC_SITE_URL} />;
  return <HubPage ctx={await loadHubContext(r.integration)} siteUrl={env.NEXT_PUBLIC_SITE_URL} />;
}
