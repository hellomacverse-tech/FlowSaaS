import { env } from '@/lib/env';
import { catalogSeed } from '@/data/catalog-seed';
import { getAllPublishedPairs } from '@/lib/pseo/resolve';

export const revalidate = 86400;

export async function GET(): Promise<Response> {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const top = (catalogSeed as unknown as readonly { slug: string; title: string; summary: string }[]).slice(0, 12);
  const pairs = (await getAllPublishedPairs()).filter((p) => p.indexable && !p.redirect_to).slice(0, 10);
  const body = [
    '# FlowSaaS',
    '',
    '> FlowSaaS sells production-ready n8n workflow templates, an all-access subscription, done-for-you managed setup, and browser-run Micro-SaaS automation tools. FlowSaaS is independent and not affiliated with n8n GmbH.',
    '',
    '## Core pages',
    `- [Workflow catalog](${base}/workflows): browse all workflows`,
    `- [Managed services](${base}/services): done-for-you n8n setup`,
    `- [Pricing](${base}/pricing)`,
    `- [Integrations](${base}/integrations): app hubs and integration guides`,
    '',
    '## Top workflows',
    ...top.map((w) => `- [${w.title}](${base}/workflows/${w.slug}): ${w.summary}`),
    ...(pairs.length
      ? ['', '## Integration guides', ...pairs.map((p) => `- [${p.slug.replace(/-/g, ' ')}](${base}/integrations/${p.slug})`)]
      : []),
    '',
  ].join('\n');
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
