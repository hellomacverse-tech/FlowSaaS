import type { PairRow, IntegrationRow } from './schemas';
import { INTEGRATION_META } from '@/config/integration-meta';

export interface WorkflowRef {
  slug: string;
  title: string;
  summary: string;
  setupMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  integrations: string[];
}
export interface RelatedPair {
  slug: string;
  label: string;
}

export interface PairViewModel {
  pair: PairRow;
  a: IntegrationRow;
  b: IntegrationRow;
  workflows: WorkflowRef[];
  related: RelatedPair[];
  tldr: { what: string; bestFor: string; setup: string; difficulty: string };
  limits: string[];
  /** Visible body text split by origin, for the 40 % templated-text gate. */
  text: { template: string; editorial: string };
}

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export function buildPairViewModel(
  pair: PairRow,
  a: IntegrationRow,
  b: IntegrationRow,
  workflows: WorkflowRef[],
  related: RelatedPair[],
): PairViewModel {
  const A = a.name;
  const B = b.name;
  const minSetup = workflows.length ? Math.min(...workflows.map((w) => w.setupMinutes)) : null;
  const hardest = workflows.length ? Math.max(...workflows.map((w) => LEVELS.indexOf(w.difficulty))) : -1;
  const limits = [
    ...(INTEGRATION_META[a.slug]?.limits ?? []),
    ...(INTEGRATION_META[b.slug]?.limits ?? []),
    ...(pair.limits_md ? [pair.limits_md] : []),
  ];
  const tldr = {
    what: pair.headline ?? `Move data from ${A} to ${B} automatically with n8n.`,
    bestFor: pair.best_for ?? '',
    setup: minSetup ? `About ${minSetup} minutes with a ready-made template` : 'Custom build; scope it with our team',
    difficulty: hardest >= 0 ? (LEVELS[hardest] as string) : 'depends on scope',
  };
  // Template strings: anything that is not specific to this pair.
  const template = [
    `Connect ${A} to ${B} with n8n`, 'TL;DR', 'What it does', 'Best for', 'Setup time', 'Difficulty',
    'Ready-made workflows', 'How the integration works',
    `${A} sends data to n8n, n8n transforms it, and ${B} receives it.`,
    'Top use cases', 'Field mapping', 'Set it up in 5 steps', 'Limits and considerations',
    'Frequently asked questions', 'Related integrations', `Browse ${A} workflows`, `Browse ${B} workflows`,
    'Book a setup call',
    workflows.length
      ? ''
      : `No ready-made workflow covers ${A} to ${B} yet. Request this workflow and our team will scope it.`,
  ].join(' ');
  const editorial = [
    pair.intro_md ?? '', tldr.what, tldr.bestFor,
    ...pair.use_cases.flatMap((u) => [u.title, u.body]),
    ...pair.field_mapping.flatMap((f) => [f.sourceField, f.targetField, f.transform, f.example]),
    ...pair.steps.flatMap((s) => [s.name, s.text]),
    ...limits,
    ...pair.faq.flatMap((f) => [f.question, f.answer]),
    ...workflows.flatMap((w) => [w.title, w.summary]),
  ].join(' ');
  return { pair, a, b, workflows, related, tldr, limits, text: { template, editorial } };
}
