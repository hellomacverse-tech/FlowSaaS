export interface QualityInput {
  publishedWorkflowsCovering: number;
  reviewedUseCases: number; // 0 unless reviewed_at is set
  fieldMappingRows: number;
  pairFaqs: number;
  relatedWorkflows: number;
  hasDiagramAndMedia: boolean; // generated diagram AND (screenshot OR video)
}

export const INDEXABLE_MIN_SCORE = 70;
export const MIN_UNIQUE_WORDS = 350;
export const MAX_TEMPLATED_RATIO = 0.4;
export const MAX_SHINGLE_OVERLAP = 0.6;

export function qualityScore(i: QualityInput): number {
  let s = 0;
  if (i.publishedWorkflowsCovering >= 1) s += 30;
  if (i.reviewedUseCases >= 4) s += 20;
  if (i.fieldMappingRows >= 5) s += 15;
  if (i.pairFaqs >= 3) s += 15;
  if (i.relatedWorkflows >= 2) s += 10;
  if (i.hasDiagramAndMedia) s += 10;
  return s;
}
