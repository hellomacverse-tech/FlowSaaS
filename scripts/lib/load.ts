import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { IntegrationRow, PairRow } from '../../src/lib/pseo/schemas';

export type Source = 'seed' | 'db';
export const sourceFromArgs = (argv: string[]): Source => (argv.includes('--source=db') ? 'db' : 'seed');

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export function serviceClient() {
  return createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
}

export async function loadPairsAndIntegrations(
  source: Source,
): Promise<{ pairs: PairRow[]; integrations: IntegrationRow[] }> {
  if (source === 'seed') {
    const raw = JSON.parse(readFileSync('supabase/seed/pairs.json', 'utf8')) as { pairs: unknown[]; integrations: unknown[] };
    return {
      pairs: raw.pairs.map((p) => PairRow.parse(p)),
      integrations: raw.integrations.map((i) => IntegrationRow.parse(i)),
    };
  }
  const db = serviceClient();
  const [p, i] = await Promise.all([
    db.from('integration_pairs').select('*').limit(10000),
    db.from('integrations').select('*').limit(1000),
  ]);
  if (p.error) throw new Error(p.error.message);
  if (i.error) throw new Error(i.error.message);
  return {
    pairs: (p.data ?? []).map((r) => PairRow.parse(r)),
    integrations: (i.data ?? []).map((r) => IntegrationRow.parse(r)),
  };
}
