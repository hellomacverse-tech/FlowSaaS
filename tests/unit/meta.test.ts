import { expect, test } from 'vitest';
import { buildPairDescription, buildPairTitle } from '@/lib/pseo/meta';
import { INTEGRATION_NAMES } from '@/config/integration-meta';

test('titles <= 60 and descriptions <= 155 for every ordered pair', () => {
  for (const a of INTEGRATION_NAMES) {
    for (const b of INTEGRATION_NAMES) {
      if (a.slug === b.slug) continue;
      expect(buildPairTitle(a, b).length).toBeLessThanOrEqual(60);
      expect(buildPairDescription(a, b, null).length).toBeLessThanOrEqual(155);
    }
  }
});
test('override wins and is clamped', () => {
  const n = { name: 'A', shortName: 'A' };
  expect(buildPairDescription(n, n, 'x'.repeat(300)).length).toBe(155);
});
