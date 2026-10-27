import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/service';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const LIVE = ['active', 'trialing'];

/** Nightly: diff Stripe's live subscriptions against our table. Alerts on drift; never auto-fixes. */
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return Response.json({ ok: false, error: 'stripe not configured' }, { status: 500 });

  const stripe = new Stripe(key);
  const inStripe = new Set<string>();
  for (const status of LIVE) {
    let seen = 0;
    for await (const s of stripe.subscriptions.list({ status: status as Stripe.SubscriptionListParams.Status, limit: 100 })) {
      inStripe.add(s.id);
      if (++seen >= 5000) break;
    }
  }
  const { data, error } = await createServiceClient().from('subscriptions').select('stripe_subscription_id,status').in('status', LIVE);
  if (error) {
    log.error('reconcile.db_error', { error: error.message });
    return Response.json({ ok: false }, { status: 500 });
  }
  const inDb = new Set((data ?? []).map((r: { stripe_subscription_id: string }) => r.stripe_subscription_id));
  const missingInDb = [...inStripe].filter((id) => !inDb.has(id));
  const staleInDb = [...inDb].filter((id) => !inStripe.has(id));
  const drift = missingInDb.length + staleInDb.length;
  (drift ? log.error : log.info)('reconcile.stripe', { stripe: inStripe.size, db: inDb.size, missingInDb, staleInDb });
  return Response.json({ ok: drift === 0, drift, missingInDb, staleInDb });
}
