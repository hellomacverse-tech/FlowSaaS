import 'server-only';
import { catalogSeed } from '@/data/catalog-seed';
import { getAllPublishedPairs, getIntegrations, type Resolved } from './resolve';
import type { IntegrationRow, PairRow } from './schemas';
import {
  pairsForWorkflow, relatedPairs, toWorkflowRef, workflowsForPair, topPairsForFooter,
  type CatalogEntry,
} from './build-context';
import { buildPairViewModel, type PairViewModel, type RelatedPair, type WorkflowRef } from './view-model';

// The catalog seed's exact type lives in Phase 2/3 code; narrow it to what pSEO reads.
const catalog = catalogSeed as unknown as readonly CatalogEntry[];

export async function loadPairContext(r: Extract<Resolved, { kind: 'pair' }>): Promise<PairViewModel> {
  const [pairs, integrations] = await Promise.all([getAllPublishedPairs(), getIntegrations()]);
  const byId = new Map(integrations.map((i) => [i.id, i]));
  return buildPairViewModel(
    r.pair, r.source, r.target,
    workflowsForPair(catalog, r.source.slug, r.target.slug),
    relatedPairs(r.pair, pairs, byId),
  );
}

export interface HubContext {
  integration: IntegrationRow;
  pairs: { pair: PairRow; partner: IntegrationRow; indexable: boolean }[];
  workflows: WorkflowRef[];
}

export async function loadHubContext(integration: IntegrationRow): Promise<HubContext> {
  const [pairs, integrations] = await Promise.all([getAllPublishedPairs(), getIntegrations()]);
  const byId = new Map(integrations.map((i) => [i.id, i]));
  const involved = pairs
    .filter((p) => !p.redirect_to && (p.source_integration === integration.id || p.target_integration === integration.id))
    .flatMap((p) => {
      const partner = byId.get(p.source_integration === integration.id ? p.target_integration : p.source_integration);
      return partner ? [{ pair: p, partner, indexable: p.indexable }] : [];
    })
    .sort((x, y) => x.partner.name.localeCompare(y.partner.name));
  return {
    integration,
    pairs: involved,
    workflows: catalog.filter((w) => w.integrations.includes(integration.slug)).map(toWorkflowRef),
  };
}

/** For the product page "Works with" block. */
export async function loadWorksWith(workflowIntegrations: readonly string[]): Promise<RelatedPair[]> {
  const [pairs, integrations] = await Promise.all([getAllPublishedPairs(), getIntegrations()]);
  return pairsForWorkflow(workflowIntegrations, pairs, new Map(integrations.map((i) => [i.id, i])));
}

/** For the footer / integrations index: top 20 indexable pairs. */
export async function loadTopPairs(): Promise<RelatedPair[]> {
  const [pairs, integrations] = await Promise.all([getAllPublishedPairs(), getIntegrations()]);
  return topPairsForFooter(pairs, new Map(integrations.map((i) => [i.id, i])));
}
