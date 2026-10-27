import { resolveIntegrationSlug } from '@/lib/pseo/resolve';
import { renderOg } from '@/lib/og/render';
import { svgToDataUri } from '@/lib/og/svg';

export const runtime = 'nodejs';
export const revalidate = 86400;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }): Promise<Response> {
  const { slug } = await ctx.params;
  const r = await resolveIntegrationSlug(slug.toLowerCase());
  if (r.kind === 'pair') {
    return renderOg({
      eyebrow: 'n8n integration',
      title: `${r.source.name} to ${r.target.name}`,
      chip: 'Templates & setup guide',
      logos: [svgToDataUri(r.source.logo_svg), svgToDataUri(r.target.logo_svg)],
    });
  }
  if (r.kind === 'hub') {
    return renderOg({
      eyebrow: 'n8n automation',
      title: `${r.integration.name} Automation with n8n`,
      logos: [svgToDataUri(r.integration.logo_svg)],
    });
  }
  return new Response('Not found', { status: 404 });
}
