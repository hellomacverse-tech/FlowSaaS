import { expect, test } from 'vitest';
import { buildCaseStudyGraph } from '@/lib/schema/case-study';

const base = { slug: 's', title: 'T', challenge: 'C', published_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' };
const SITE = 'https://flowsaas.com';

test('no Article for seed or unverified', () => {
  expect(buildCaseStudyGraph({ ...base, verified: false, is_seed: true }, SITE)).toBeNull();
  expect(buildCaseStudyGraph({ ...base, verified: true, is_seed: true }, SITE)).toBeNull();
  expect(buildCaseStudyGraph({ ...base, verified: false, is_seed: false }, SITE)).toBeNull();
});
test('Article for verified non-seed', () => {
  const g = buildCaseStudyGraph({ ...base, verified: true, is_seed: false }, SITE);
  expect(g?.['@graph'][0]?.['@type']).toBe('Article');
});
