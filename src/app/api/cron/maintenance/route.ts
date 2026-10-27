import { createServiceClient } from '@/lib/supabase/service';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Daily: 30-day sandbox purge (spec 15.2) and finalising runs stuck in queued/running past the 15 s ceiling. */
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
  const db = createServiceClient();
  const purge = await db.rpc('purge_old_sandbox_runs');
  const stale = await db
    .from('sandbox_runs')
    .update({ status: 'timeout' })
    .in('status', ['queued', 'running'])
    .lt('created_at', new Date(Date.now() - 60_000).toISOString());
  const ok = !purge.error && !stale.error;
  (ok ? log.info : log.error)('cron.maintenance', { purgeError: purge.error?.message ?? null, staleError: stale.error?.message ?? null });
  return Response.json({ ok }, { status: ok ? 200 : 500 });
}
