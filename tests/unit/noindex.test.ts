import { expect, test } from 'vitest';
import { shouldNoindex } from '@/lib/seo/noindex';

test.each([
  ['/workflows', '', false], ['/workflows', 'q=crm', true], ['/workflows', 'sort=roi', true], ['/workflows', 'page=2', true],
  ['/workflows', 'utm_source=x&gclid=1', false], ['/workflows', 'utm_source=x&q=a', true],
  ['/categories/e-commerce', 'price=50', true], ['/pricing', 'foo=1', false],
])('%s?%s -> %s', (path, qs, want) => {
  expect(shouldNoindex(path, new URLSearchParams(qs))).toBe(want);
});
