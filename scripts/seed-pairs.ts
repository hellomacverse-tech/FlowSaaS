import { readFileSync } from 'node:fs';
import { catalogSeed } from '../src/data/catalog-seed';
import { evaluatePair } from '../src/lib/pseo/evaluate';
import type { CatalogEntry } from '../src/lib/pseo/build-context';
import { IntegrationRow, PairRow } from '../src/lib/pseo/schemas';
import { requireEnv, serviceClient } from './lib/load';

export const PAIR_TUPLES: ReadonlyArray<readonly [string, string]> = [
  ['facebook-messenger', 'google-sheets'], ['facebook-messenger', 'airtable'], ['facebook-messenger', 'telegram'],
  ['facebook-messenger', 'slack'], ['facebook-messenger', 'hubspot'], ['facebook-messenger', 'openai'],
  ['facebook-pages', 'facebook-messenger'], ['facebook-pages', 'google-sheets'],
  ['shopify', 'google-sheets'], ['shopify', 'telegram'], ['shopify', 'slack'], ['shopify', 'gmail'],
  ['shopify', 'airtable'], ['shopify', 'facebook-messenger'],
  ['openai', 'google-sheets'], ['openai', 'airtable'], ['openai', 'telegram'], ['openai', 'slack'], ['openai', 'notion'],
  ['gmail', 'airtable'], ['gmail', 'openai'], ['gmail', 'google-sheets'],
  ['wordpress', 'linkedin'], ['wordpress', 'x-twitter'], ['wordpress', 'facebook-pages'], ['wordpress', 'telegram'],
  ['google-sheets', 'telegram'], ['google-sheets', 'slack'], ['airtable', 'slack'], ['airtable', 'telegram'],
  ['webhook', 'google-sheets'], ['webhook', 'airtable'], ['stripe', 'google-sheets'], ['stripe', 'slack'],
  ['telegram', 'openai'],
];

async function seed(): Promise<void> {
  requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const db = serviceClient();
  const { data: ints, error } = await db.from('integrations').select('id,slug');
  if (error) throw new Error(error.message);
  const idBySlug = new Map((ints ?? []).map((i: { id: string; slug: string }) => [i.slug, i.id]));
  const missing = [...new Set(PAIR_TUPLES.flat())].filter((s) => !idBySlug.has(s));
  if (missing.length) throw new Error(`integrations missing in DB (run pnpm seed first): ${missing.join(', ')}`);

  const authored = new Map(
    (JSON.parse(readFileSync('supabase/seed/pairs.json', 'utf8')) as { pairs: Record<string, unknown>[] }).pairs.map(
      (p) => [String(p.slug), p],
    ),
  );
  const now = new Date().toISOString();
  const rows = PAIR_TUPLES.map(([a, b]) => {
    const slug = `${a}-to-${b}`;
    const base = authored.get(slug);
    const content = base
      ? (({ headline, intro_md, best_for, use_cases, field_mapping, steps, limits_md, faq }) => ({ headline, intro_md, best_for, use_cases, field_mapping, steps, limits_md, faq }))(base as Record<string, never>)
      : { headline: null, intro_md: null, best_for: null, use_cases: [], field_mapping: [], steps: [], limits_md: null, faq: [] };
    return {
      slug,
      source_integration: idBySlug.get(a),
      target_integration: idBySlug.get(b),
      ...content,
      quality_score: 0,
      indexable: false, // promotion is a separate, gated step
      published_at: now,
    };
  });
  // ignoreDuplicates: re-running the seed never overwrites an editor's work.
  const { error: upErr } = await db.from('integration_pairs').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true });
  if (upErr) throw new Error(upErr.message);
  console.log(`seed-pairs: ${rows.length} pair rows ensured (all non-indexable until promoted)`);
}

async function promote(): Promise<void> {
  const db = serviceClient();
  const [p, i] = await Promise.all([
    db.from('integration_pairs').select('*').limit(10000),
    db.from('integrations').select('*').limit(1000),
  ]);
  if (p.error) throw new Error(p.error.message);
  if (i.error) throw new Error(i.error.message);
  const pairs = (p.data ?? []).map((r) => PairRow.parse(r));
  const integrations = (i.data ?? []).map((r) => IntegrationRow.parse(r));
  const byId = new Map(integrations.map((x) => [x.id, x]));
  const catalog = catalogSeed as unknown as readonly CatalogEntry[];
  let promoted = 0;

  for (const pair of pairs.filter((x) => x.reviewed_at && !x.indexable && !x.redirect_to)) {
    const a = byId.get(pair.source_integration);
    const b = byId.get(pair.target_integration);
    if (!a || !b) continue;
    const ev = evaluatePair(pair, a, b, catalog, pairs, byId);
    const ok = ev.problems.length === 0;
    const { error } = await db
      .from('integration_pairs')
      .update({ quality_score: ev.score, unique_word_count: ev.unique, templated_ratio: ev.ratio, indexable: ok })
      .eq('id', pair.id);
    if (error) console.error(`  ${pair.slug}: update failed: ${error.message}`);
    else if (ok) {
      promoted++;
      console.log(`  PROMOTED ${pair.slug} (score ${ev.score}, ${ev.unique} unique words, ratio ${ev.ratio})`);
    } else console.log(`  held back ${pair.slug}: ${ev.problems.join('; ')}`);
  }
  console.log(`promote: ${promoted} page(s) promoted. Now call POST /api/revalidate with {"tags":["integrations","catalog"]}.`);
}

(process.argv.includes('--promote') ? promote() : seed()).catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
