import type { IntegrationRow, PairRow } from './schemas';
import type { RelatedPair, WorkflowRef } from './view-model';

/** Pure helpers shared by server pages and CLI audits (no server-only imports). */
export interface CatalogEntry {
  slug: string;
  title: string;
  summary: string;
  integrations: readonly string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  setupMinutes: number;
}

export function toWorkflowRef(w: CatalogEntry): WorkflowRef {
  return {
    slug: w.slug, title: w.title, summary: w.summary,
    setupMinutes: w.setupMinutes, difficulty: w.difficulty, integrations: [...w.integrations],
  };
}

export function workflowsForPair(catalog: readonly CatalogEntry[], aSlug: string, bSlug: string): WorkflowRef[] {
  return catalog.filter((w) => w.integrations.includes(aSlug) && w.integrations.includes(bSlug)).map(toWorkflowRef);
}

/** Workflows that use at least one of the two apps but not both (for the "related workflows" quality signal). */
export function adjacentWorkflowCount(catalog: readonly CatalogEntry[], aSlug: string, bSlug: string): number {
  return catalog.filter((w) => {
    const hasA = w.integrations.includes(aSlug);
    const hasB = w.integrations.includes(bSlug);
    return (hasA || hasB) && !(hasA && hasB);
  }).length;
}

function label(p: PairRow, byId: Map<string, IntegrationRow>): string {
  return `${byId.get(p.source_integration)?.name ?? '?'} to ${byId.get(p.target_integration)?.name ?? '?'}`;
}

/** Indexable pairs that share one app with `pair`, best quality first. */
export function relatedPairs(
  pair: PairRow,
  all: readonly PairRow[],
  byId: Map<string, IntegrationRow>,
  limit = 6,
): RelatedPair[] {
  return all
    .filter(
      (p) =>
        p.id !== pair.id && p.indexable && !p.redirect_to &&
        (p.source_integration === pair.source_integration || p.source_integration === pair.target_integration ||
          p.target_integration === pair.source_integration || p.target_integration === pair.target_integration),
    )
    .sort((x, y) => y.quality_score - x.quality_score || x.slug.localeCompare(y.slug))
    .slice(0, limit)
    .map((p) => ({ slug: p.slug, label: label(p, byId) }));
}

/** Indexable pairs whose two apps are both used by a workflow (the WorksWith block). */
export function pairsForWorkflow(
  workflowIntegrations: readonly string[],
  pairs: readonly PairRow[],
  byId: Map<string, IntegrationRow>,
): RelatedPair[] {
  return pairs
    .filter((p) => {
      if (!p.indexable || p.redirect_to) return false;
      const a = byId.get(p.source_integration)?.slug;
      const b = byId.get(p.target_integration)?.slug;
      return Boolean(a && b && workflowIntegrations.includes(a) && workflowIntegrations.includes(b));
    })
    .map((p) => ({ slug: p.slug, label: label(p, byId).replace(' to ', ' → ') }));
}

export function topPairsForFooter(
  pairs: readonly PairRow[],
  byId: Map<string, IntegrationRow>,
  n = 20,
): RelatedPair[] {
  return pairs
    .filter((p) => p.indexable && !p.redirect_to)
    .sort((x, y) => y.quality_score - x.quality_score || x.slug.localeCompare(y.slug))
    .slice(0, n)
    .map((p) => ({ slug: p.slug, label: label(p, byId) }));
}
