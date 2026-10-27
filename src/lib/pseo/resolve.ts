import 'server-only';
import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import { IntegrationRow, PairRow } from './schemas';

export { IntegrationRow, PairRow } from './schemas';
export type { IntegrationRow as IntegrationRowT, PairRow as PairRowT } from './schemas';

export type Resolved =
  | { kind: 'pair'; pair: PairRow; source: IntegrationRow; target: IntegrationRow }
  | { kind: 'hub'; integration: IntegrationRow }
  | { kind: 'redirect'; to: string }
  | { kind: 'notFound' };

const SLUG_RE = /^[a-z0-9-]{1,120}$/;
export const PSEO_TAG = 'integrations';

/** Supabase caps responses at 1000 rows; page through everything. */
async function fetchAll<T>(
  run: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
  parse: (r: unknown) => T,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await run(from, from + 999);
    if (error) throw new Error(`pSEO fetch failed: ${error.message}`);
    const rows = data ?? [];
    out.push(...rows.map(parse));
    if (rows.length < 1000) return out;
  }
}

export const getIntegrations = unstable_cache(
  async (): Promise<IntegrationRow[]> => {
    const db = createServiceClient();
    return fetchAll(
      (f, t) => db.from('integrations').select('*').order('slug').range(f, t),
      (r) => IntegrationRow.parse(r),
    );
  },
  ['pseo:integrations'],
  { tags: [PSEO_TAG, 'catalog'], revalidate: 86400 },
);

export const getAllPublishedPairs = unstable_cache(
  async (): Promise<PairRow[]> => {
    const db = createServiceClient();
    return fetchAll(
      (f, t) =>
        db.from('integration_pairs').select('*').not('published_at', 'is', null).order('slug').range(f, t),
      (r) => PairRow.parse(r),
    );
  },
  ['pseo:pairs'],
  { tags: [PSEO_TAG], revalidate: 86400 },
);

/** Never splits the slug on "-to-": it is always looked up (slugs like facebook-messenger contain hyphens). */
export async function resolveIntegrationSlug(raw: string): Promise<Resolved> {
  if (!SLUG_RE.test(raw)) {
    const lower = raw.toLowerCase();
    return SLUG_RE.test(lower) ? { kind: 'redirect', to: `/integrations/${lower}` } : { kind: 'notFound' };
  }
  const [pairs, integrations] = await Promise.all([getAllPublishedPairs(), getIntegrations()]);
  const byId = new Map(integrations.map((i) => [i.id, i]));

  const pair = pairs.find((p) => p.slug === raw);
  if (pair) {
    if (pair.redirect_to) return { kind: 'redirect', to: pair.redirect_to };
    const source = byId.get(pair.source_integration);
    const target = byId.get(pair.target_integration);
    return source && target ? { kind: 'pair', pair, source, target } : { kind: 'notFound' };
  }
  const integration = integrations.find((i) => i.slug === raw);
  return integration ? { kind: 'hub', integration } : { kind: 'notFound' };
}

/** A hub is indexable only with real substance: >=1 published workflow or >=3 indexable pairs. */
export function hubIsIndexable(
  integrationId: string,
  pairs: PairRow[],
  publishedWorkflowCount: number,
): boolean {
  const indexablePairs = pairs.filter(
    (p) => p.indexable && (p.source_integration === integrationId || p.target_integration === integrationId),
  ).length;
  return publishedWorkflowCount >= 1 || indexablePairs >= 3;
}
