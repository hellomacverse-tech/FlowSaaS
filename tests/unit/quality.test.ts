import { describe, expect, test } from 'vitest';
import { qualityScore } from '@/lib/pseo/quality';

describe('qualityScore', () => {
  test('full marks', () => expect(qualityScore({ publishedWorkflowsCovering: 2, reviewedUseCases: 4, fieldMappingRows: 5, pairFaqs: 3, relatedWorkflows: 2, hasDiagramAndMedia: true })).toBe(100));
  test('unreviewed use cases earn nothing', () => expect(qualityScore({ publishedWorkflowsCovering: 1, reviewedUseCases: 0, fieldMappingRows: 6, pairFaqs: 3, relatedWorkflows: 2, hasDiagramAndMedia: false })).toBe(70));
  test('thin page scores 0', () => expect(qualityScore({ publishedWorkflowsCovering: 0, reviewedUseCases: 0, fieldMappingRows: 2, pairFaqs: 0, relatedWorkflows: 0, hasDiagramAndMedia: false })).toBe(0));
});
