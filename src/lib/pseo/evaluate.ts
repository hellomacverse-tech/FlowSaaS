import type { IntegrationRow, PairRow } from './schemas';
import { INDEXABLE_MIN_SCORE, MAX_TEMPLATED_RATIO, MIN_UNIQUE_WORDS, qualityScore } from './quality';
import { wordCount } from './audit-core';
import { adjacentWorkflowCount, relatedPairs, workflowsForPair, type CatalogEntry } from './build-context';
import { buildPairViewModel, type PairViewModel } from './view-model';
import { INTEGRATION_META } from '@/config/integration-meta';

export interface Evaluation {
  vm: PairViewModel;
  score: number;
  unique: number;
  ratio: number;
  problems: string[];
}

/** One evaluation used by the promote step AND the CI audit, so they can never disagree. */
export function evaluatePair(
  pair: PairRow,
  a: IntegrationRow,
  b: IntegrationRow,
  catalog: readonly CatalogEntry[],
  allPairs: readonly PairRow[],
  byId: Map<string, IntegrationRow>,
): Evaluation {
  const workflows = workflowsForPair(catalog, a.slug, b.slug);
  const vm = buildPairViewModel(pair, a, b, workflows, relatedPairs(pair, allPairs, byId));
  const t = wordCount(vm.text.template);
  const e = wordCount(vm.text.editorial);
  const ratio = t + e === 0 ? 1 : Math.round((t / (t + e)) * 1000) / 1000;
  const score = qualityScore({
    publishedWorkflowsCovering: workflows.length,
    reviewedUseCases: pair.reviewed_at ? pair.use_cases.length : 0,
    fieldMappingRows: pair.field_mapping.length,
    pairFaqs: pair.faq.length,
    relatedWorkflows: adjacentWorkflowCount(catalog, a.slug, b.slug),
    hasDiagramAndMedia: Boolean(pair.screenshot_url || pair.video_url),
  });
  const problems: string[] = [];
  if (score < INDEXABLE_MIN_SCORE) problems.push(`score ${score} < ${INDEXABLE_MIN_SCORE}`);
  if (e < MIN_UNIQUE_WORDS) problems.push(`unique words ${e} < ${MIN_UNIQUE_WORDS}`);
  if (ratio > MAX_TEMPLATED_RATIO) problems.push(`templated ratio ${ratio} > ${MAX_TEMPLATED_RATIO}`);
  if (!pair.reviewed_at) problems.push('not human-reviewed (reviewed_at is null)');
  if (!pair.published_at) problems.push('not published');
  if (pair.redirect_to) problems.push('is a redirect');
  const intro = wordCount(pair.intro_md ?? '');
  if (intro < 40 || intro > 60) problems.push(`intro is ${intro} words; must be 40-60`);
  if (pair.meta_description && pair.meta_description.length > 155) problems.push('meta_description > 155 chars');
  for (const x of [a, b]) if (!INTEGRATION_META[x.slug]?.limits.length) problems.push(`no limits authored for ${x.slug}`);
  return { vm, score, unique: e, ratio, problems };
}
