import { revalidateTag } from 'next/cache';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ tags: z.array(z.enum(['integrations', 'catalog', 'case-studies', 'home'])).min(1).max(4) });

/** Editor tooling endpoint: call after publishing or promoting pSEO pages or case studies. Bearer CRON_SECRET. */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid body' }, { status: 400 });
  for (const t of parsed.data.tags) revalidateTag(t);
  return Response.json({ revalidated: parsed.data.tags });
}
