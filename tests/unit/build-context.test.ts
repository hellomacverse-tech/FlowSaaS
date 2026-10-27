import { expect, test } from 'vitest';
import { relatedPairs, topPairsForFooter, workflowsForPair, type CatalogEntry } from '@/lib/pseo/build-context';
import type { IntegrationRow, PairRow } from '@/lib/pseo/schemas';

const mkInt = (n: number, slug: string): IntegrationRow => ({ id: `00000000-0000-4000-8000-00000000000${n}`, slug, name: slug, logo_svg: null, description: null, docs_url: null, popularity: 0, updated_at: '' });
const ints = [mkInt(1, 'a'), mkInt(2, 'b'), mkInt(3, 'c')];
const byId = new Map(ints.map((i) => [i.id, i]));
const mkPair = (id: string, s: IntegrationRow, t: IntegrationRow, indexable: boolean, q: number): PairRow => ({
  id, slug: `${s.slug}-to-${t.slug}`, source_integration: s.id, target_integration: t.id, headline: null, intro_md: null, best_for: null,
  use_cases: [], field_mapping: [], faq: [], steps: [], limits_md: null, screenshot_url: null, video_url: null, meta_title: null,
  meta_description: null, quality_score: q, indexable, published_at: '', reviewed_at: null, redirect_to: null, unique_word_count: 0, templated_ratio: 1, updated_at: '',
});
const ab = mkPair('p1', ints[0]!, ints[1]!, true, 80);
const bc = mkPair('p2', ints[1]!, ints[2]!, true, 90);
const ac = mkPair('p3', ints[0]!, ints[2]!, false, 99);

test('related pairs are indexable, share an app, exclude self', () => {
  expect(relatedPairs(ab, [ab, bc, ac], byId).map((r) => r.slug)).toEqual(['b-to-c']);
});
test('footer lists only indexable pairs, best first', () => {
  expect(topPairsForFooter([ab, bc, ac], byId).map((r) => r.slug)).toEqual(['b-to-c', 'a-to-b']);
});
test('workflowsForPair requires both apps', () => {
  const cat: CatalogEntry[] = [
    { slug: 'w1', title: 't', summary: 's', integrations: ['a', 'b'], difficulty: 'beginner', setupMinutes: 10 },
    { slug: 'w2', title: 't', summary: 's', integrations: ['a'], difficulty: 'beginner', setupMinutes: 10 },
  ];
  expect(workflowsForPair(cat, 'a', 'b').map((w) => w.slug)).toEqual(['w1']);
});
