import { getPublishedCaseStudy } from '@/lib/case-studies';
import { renderOg } from '@/lib/og/render';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

/** 404 unless published AND verified AND not seed (the loader enforces it): a seed case study never gets a public image. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }): Promise<Response> {
  const { slug } = await ctx.params;
  const cs = await getPublishedCaseStudy(slug);
  if (!cs) return new Response('Not found', { status: 404 });
  const first = cs.results[0];
  return renderOg({
    eyebrow: 'Case study',
    title: cs.title,
    ...(first ? { chip: `${first.label}: ${first.value}` } : {}),
  });
}
