import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

const DISALLOW = ['/app/', '/api/', '/login', '/signup', '/checkout', '/auth/'];
const AI_BOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot'];

export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const allowAi = process.env.ALLOW_AI_CRAWLERS !== 'false';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      // A bot with its own group IGNORES the '*' group, so the disallows must be repeated.
      ...AI_BOTS.map((userAgent) =>
        allowAi ? { userAgent, allow: '/', disallow: DISALLOW } : { userAgent, disallow: '/' },
      ),
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
