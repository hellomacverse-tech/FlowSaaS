import { expect, test } from 'vitest';
import { auditPages, containment, shingles } from '@/lib/pseo/audit-core';

const para = (n: number, seed: string): string => Array.from({ length: n }, (_, i) => `${seed}${i}`).join(' ');

test('flags thin page', () => {
  expect(auditPages([{ slug: 'a', template: para(10, 't'), editorial: para(100, 'e') }]).map((v) => v.rule)).toContain('min-unique-words');
});
test('flags templated-heavy page', () => {
  expect(auditPages([{ slug: 'a', template: para(400, 't'), editorial: para(400, 'e') }]).map((v) => v.rule)).toContain('templated-ratio');
});
test('flags near-duplicates and passes distinct pages', () => {
  const same = para(400, 'x');
  expect(auditPages([{ slug: 'a', template: '', editorial: same }, { slug: 'b', template: '', editorial: same }]).some((v) => v.rule === 'shingle-overlap')).toBe(true);
  expect(auditPages([{ slug: 'a', template: '', editorial: para(400, 'x') }, { slug: 'b', template: '', editorial: para(400, 'y') }]).some((v) => v.rule === 'shingle-overlap')).toBe(false);
});
test('containment of identical sets is 1', () => {
  expect(containment(shingles(para(50, 'z')), shingles(para(50, 'z')))).toBe(1);
});
