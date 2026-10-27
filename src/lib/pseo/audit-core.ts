export function wordCount(s: string): number {
  return s.replace(/[#*_`>|\[\]()]/g, ' ').split(/\s+/).filter(Boolean).length;
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function shingles(text: string, k = 5): Set<number> {
  const w = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set<number>();
  for (let i = 0; i + k <= w.length; i++) out.add(fnv1a(w.slice(i, i + k).join(' ')));
  return out;
}

/** Containment of the smaller set in the larger: stricter than Jaccard, catches "same page, swapped names". */
export function containment(a: Set<number>, b: Set<number>): number {
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  if (small.size === 0) return 0;
  let hit = 0;
  for (const h of small) if (big.has(h)) hit++;
  return hit / small.size;
}

export interface PageText {
  slug: string;
  template: string;
  editorial: string;
}
export interface Violation {
  slug: string;
  rule: string;
  detail: string;
}

export function auditPages(
  pages: PageText[],
  opts = { minUnique: 350, maxTemplated: 0.4, maxOverlap: 0.6 },
): Violation[] {
  const v: Violation[] = [];
  const sets = pages.map((p) => shingles(`${p.template} ${p.editorial}`));
  for (const p of pages) {
    const t = wordCount(p.template);
    const e = wordCount(p.editorial);
    const ratio = t + e === 0 ? 1 : t / (t + e);
    if (e < opts.minUnique) v.push({ slug: p.slug, rule: 'min-unique-words', detail: `${e} < ${opts.minUnique}` });
    if (ratio > opts.maxTemplated) v.push({ slug: p.slug, rule: 'templated-ratio', detail: ratio.toFixed(3) });
  }
  // Inverted index: only compare pages that share at least one shingle.
  const inv = new Map<number, number[]>();
  sets.forEach((s, i) => {
    for (const h of s) {
      const l = inv.get(h);
      if (l) l.push(i);
      else inv.set(h, [i]);
    }
  });
  const seen = new Set<string>();
  for (const posting of inv.values()) {
    if (posting.length > 40) continue; // boilerplate shingle shared by many pages; the templated-ratio gate covers it
    for (let x = 0; x < posting.length; x++) {
      for (let y = x + 1; y < posting.length; y++) {
        const i = posting[x] as number;
        const j = posting[y] as number;
        const key = `${i}:${j}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const c = containment(sets[i] as Set<number>, sets[j] as Set<number>);
        if (c > opts.maxOverlap) {
          v.push({ slug: (pages[i] as PageText).slug, rule: 'shingle-overlap', detail: `${(pages[j] as PageText).slug} ${c.toFixed(2)}` });
        }
      }
    }
  }
  return v;
}
