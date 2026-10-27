import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

async function pingSupabase(): Promise<void> {
  const r = await createServiceClient().from('workflows').select('id', { head: true, count: 'exact' }).limit(1);
  if (r.error) throw new Error(r.error.message);
}

async function pingRedis(): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('redis not configured');
  const r = await fetch(`${url.replace(/\/$/, '')}/ping`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(3000) });
  const body = (await r.json()) as { result?: string };
  if (!r.ok || body.result !== 'PONG') throw new Error('redis ping failed');
}

/** Reaches the static health webhook (n8n/sandbox/flowsaas-health.json). Proves routing + workers, not signing. */
async function pingN8n(): Promise<void> {
  const base = process.env.N8N_BASE_URL;
  if (!base) throw new Error('n8n not configured');
  const r = await fetch(`${base.replace(/\/$/, '')}/webhook/flowsaas-health`, { signal: AbortSignal.timeout(3000), redirect: 'error' });
  if (!r.ok) throw new Error(`n8n status ${r.status}`);
}

/** Readiness. Bearer CRON_SECRET. Returns 503 if any dependency fails. */
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
  const t0 = Date.now();
  const names = ['supabase', 'redis', 'n8n'] as const;
  const results = await Promise.allSettled([pingSupabase(), pingRedis(), pingN8n()]);
  const body = Object.fromEntries(results.map((r, i) => [names[i], r.status === 'fulfilled' ? 'ok' : 'fail']));
  const ok = results.every((r) => r.status === 'fulfilled');
  return Response.json({ ok, ...body, ms: Date.now() - t0 }, { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
