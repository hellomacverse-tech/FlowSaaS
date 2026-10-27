import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildPairGraph } from '@/lib/schema/pair';
import { buildPairViewModel } from '@/lib/pseo/view-model';
import { IntegrationRow, PairRow } from '@/lib/pseo/schemas';

const raw = JSON.parse(readFileSync('supabase/seed/pairs.json', 'utf8')) as { pairs: unknown[]; integrations: unknown[] };
const pair = PairRow.parse(raw.pairs[0]);
const [a, b] = raw.integrations.map((i) => IntegrationRow.parse(i)) as [IntegrationRow, IntegrationRow];
const SITE = 'https://flowsaas.com';

describe('buildPairGraph', () => {
  const vm = buildPairViewModel(pair, a, b, [], []);
  const graph = buildPairGraph(vm, SITE);
  const nodes = graph['@graph'];
  test('one HowToStep per step and one Question per FAQ', () => {
    const howto = nodes.find((n) => n['@type'] === 'HowTo') as { step: unknown[] };
    const faq = nodes.find((n) => n['@type'] === 'FAQPage') as { mainEntity: unknown[] };
    expect(howto.step).toHaveLength(pair.steps.length);
    expect(faq.mainEntity).toHaveLength(pair.faq.length);
  });
  test('never emits ratings or reviews', () => expect(JSON.stringify(graph)).not.toMatch(/aggregateRating|"Review"/));
  test('every @id starts with the page URL', () => {
    for (const n of nodes) expect(String(n['@id'])).toMatch(new RegExp(`^${SITE}/integrations/${pair.slug}#`));
  });
  test('omits ItemList when no workflows', () => expect(nodes.some((n) => n['@type'] === 'ItemList')).toBe(false));
});
