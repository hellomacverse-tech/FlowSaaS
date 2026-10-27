import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import * as metricsModule from '../src/config/metrics';

const fails: string[] = [];
const warns: string[] = [];
const fail = (m: string): void => void fails.push(m);
const env = process.env;
const NINETY_DAYS = 90 * 86_400_000;

type Metric = { substantiation?: string; lastVerifiedAt?: string };

async function main(): Promise<void> {
  // 16.1 metrics substantiated and fresh. Accepts an array or an object export.
  const mod = metricsModule as unknown as Record<string, unknown>;
  const raw = mod.METRICS ?? mod.metrics ?? mod.default;
  const metrics = (Array.isArray(raw) ? raw : Object.values((raw ?? {}) as object)) as Metric[];
  if (metrics.length === 0) fail('config/metrics: no metrics found');
  metrics.forEach((m, i) => {
    if (!m.substantiation || m.substantiation.trim().length < 20) fail(`metric #${i}: missing substantiation`);
    if (!m.lastVerifiedAt || Date.now() - Date.parse(m.lastVerifiedAt) > NINETY_DAYS) fail(`metric #${i}: lastVerifiedAt missing or > 90 days old`);
  });

  if (env.NEXT_PUBLIC_SHOW_SEED_CONTENT === 'true') fail('NEXT_PUBLIC_SHOW_SEED_CONTENT is true');
  if (env.N8N_MODE !== 'live') fail(`N8N_MODE must be "live" in production (got ${env.N8N_MODE ?? 'unset'})`);

  // Cloudflare documented test keys look like 1x000...AA / 2x000...AB / 3x000...FF
  const TURNSTILE_TEST = /^[123]x0{10,}[A-Z]{2}$/;
  for (const k of ['NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY']) {
    const v = env[k];
    if (v && TURNSTILE_TEST.test(v)) fail(`${k} is a Cloudflare TEST key`);
  }
  if (!env.TURNSTILE_SECRET_KEY) fail('TURNSTILE_SECRET_KEY missing');
  if (!env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) fail('STRIPE_SECRET_KEY is not a live key');
  for (const k of ['STRIPE_PRICE_VIP_MONTHLY', 'STRIPE_PRICE_VIP_ANNUAL', 'STRIPE_WEBHOOK_SECRET', 'SENTRY_DSN', 'CRON_SECRET', 'ENCRYPTION_KEY_BASE64', 'RESEND_API_KEY']) {
    if (!env[k]) fail(`${k} missing`);
  }
  if (Buffer.from(env.ENCRYPTION_KEY_BASE64 ?? '', 'base64').length !== 32) fail('ENCRYPTION_KEY_BASE64 must decode to 32 bytes');
  if (!env.NEXT_PUBLIC_SITE_URL?.startsWith('https://')) fail('NEXT_PUBLIC_SITE_URL must be https');

  // 16.7 + Phase 4: workflow JSONs must not be generated skeletons
  const manifest = JSON.parse(readFileSync('n8n/workflows/manifest.json', 'utf8')) as {
    workflows: { slug: string; isSkeleton?: boolean; testedWithN8n?: string }[];
  };
  for (const w of manifest.workflows) {
    if (w.isSkeleton !== false) fail(`workflow ${w.slug}: isSkeleton is not explicitly false (use scripts/import-workflow.ts with a tested export)`);
    if (!w.testedWithN8n) fail(`workflow ${w.slug}: no testedWithN8n version recorded`);
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    fail('Supabase env missing: cannot run database checks');
  } else {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const count = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>): Promise<number> => {
      const r = await q;
      if (r.error) {
        fail(`db: ${r.error.message}`);
        return -1;
      }
      return r.count ?? 0;
    };
    const head = { count: 'exact' as const, head: true };
    if ((await count(db.from('testimonials').select('*', head).eq('is_seed', true).eq('verified', true))) > 0) fail('seed testimonial marked verified');
    if ((await count(db.from('case_studies').select('*', head).eq('published', true).eq('is_seed', true))) > 0) fail('seed case study published');
    if ((await count(db.from('reviews').select('*', head).eq('is_seed', true).eq('status', 'approved'))) > 0) fail('seed review approved (would feed aggregateRating)');
    const published = await count(db.from('workflows').select('*', head).eq('status', 'published'));
    if (published < 1) fail('no published workflows');
    if ((await count(db.from('booking_slots').select('*', head).gt('starts_at', new Date().toISOString()))) < 1) warns.push('no future booking slots: the calendar will be empty');
    console.log(`published workflows: ${published} -> hero label "${published >= 100 ? '100+' : published}"`);
    const { data: rls } = await db.rpc('rls_disabled_tables');
    if (Array.isArray(rls) && rls.length) fail(`tables without RLS: ${rls.join(', ')}`);
  }

  for (const p of ['privacy', 'terms', 'refunds', 'security']) {
    try {
      readFileSync(`src/app/(marketing)/(legal)/${p}/page.tsx`);
    } catch {
      fail(`legal page missing: ${p}`);
    }
  }

  warns.forEach((w) => console.warn('warn:', w));
  fails.forEach((f) => console.error('FAIL:', f));
  console.log(fails.length ? `launch-gate: ${fails.length} blocker(s)` : 'launch-gate: PASS');
  process.exit(fails.length ? 1 : 0);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(2);
});
