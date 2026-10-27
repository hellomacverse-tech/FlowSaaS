import type { PairViewModel } from './view-model';

export const MAX_LINKS_PER_PAGE = 100;
/** Approximate header + footer link count that every page already carries. */
export const CHROME_LINK_COUNT = 30;

export interface PairLinks {
  hrefs: string[];
  workflowCards: { slug: string; title: string; summary: string }[];
}

export function pairLinks(vm: PairViewModel): PairLinks {
  const workflowCards = vm.workflows.slice(0, 6).map((w) => ({ slug: w.slug, title: w.title, summary: w.summary }));
  const hrefs = [
    '/', '/integrations', '/workflows', '/services#book', '/services', '/pricing',
    `/integrations/${vm.a.slug}`, `/integrations/${vm.b.slug}`,
    ...vm.related.map((r) => `/integrations/${r.slug}`),
    ...workflowCards.map((w) => `/workflows/${w.slug}`),
  ];
  return { hrefs: [...new Set(hrefs)], workflowCards };
}
