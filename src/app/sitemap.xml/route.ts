import { dynamicChunkCount, siteBaseUrl } from '@/lib/pseo/sitemap-entries';

export const revalidate = 3600;

/** Explicit sitemap index. If your Next version already serves /sitemap.xml for generateSitemaps(), delete this file. */
export async function GET(): Promise<Response> {
  const n = await dynamicChunkCount();
  const base = siteBaseUrl();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Array.from(
    { length: n + 1 },
    (_, i) => `  <sitemap><loc>${base}/sitemap/${i}.xml</loc></sitemap>`,
  ).join('\n')}\n</sitemapindex>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
