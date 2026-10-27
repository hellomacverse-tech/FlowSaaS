import { z } from 'zod';

/** Pure zod schemas (no server-only / next imports) so CLI scripts run under tsx. */
export const UseCase = z.object({ title: z.string().min(3), body: z.string().min(40) });
export const FieldMap = z.object({
  sourceField: z.string().min(1),
  targetField: z.string().min(1),
  transform: z.string().min(1),
  example: z.string().min(1),
});
export const Step = z.object({ name: z.string().min(3), text: z.string().min(20) });
export const PairFaq = z.object({ question: z.string().min(8), answer: z.string().min(20) });

export const PairRow = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  source_integration: z.string().uuid(),
  target_integration: z.string().uuid(),
  headline: z.string().nullable(),
  intro_md: z.string().nullable(),
  best_for: z.string().nullable(),
  use_cases: z.array(UseCase),
  field_mapping: z.array(FieldMap),
  faq: z.array(PairFaq),
  steps: z.array(Step),
  limits_md: z.string().nullable(),
  screenshot_url: z.string().nullable(),
  video_url: z.string().nullable(),
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  quality_score: z.number().int(),
  indexable: z.boolean(),
  published_at: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  redirect_to: z.string().nullable(),
  unique_word_count: z.number().int(),
  templated_ratio: z.coerce.number(),
  updated_at: z.string(),
});
export type PairRow = z.infer<typeof PairRow>;

export const IntegrationRow = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  logo_svg: z.string().nullable(),
  description: z.string().nullable(),
  docs_url: z.string().nullable(),
  popularity: z.number().int(),
  updated_at: z.string(),
});
export type IntegrationRow = z.infer<typeof IntegrationRow>;
export type FieldMapping = z.infer<typeof FieldMap>;
