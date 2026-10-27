import 'server-only';
import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/service';

export const CaseResult = z.object({ label: z.string().min(1), value: z.string().min(1), source: z.string().min(1) });
export const CaseStudyRow = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  client_name: z.string(),
  industry: z.string().nullable(),
  challenge: z.string(),
  solution: z.string(),
  results: z.array(CaseResult).min(1),
  quote: z.string().nullable(),
  verified: z.boolean(),
  is_seed: z.boolean(),
  published: z.boolean(),
  published_at: z.string().nullable(),
  image_url: z.string().nullable(),
  updated_at: z.string(),
});
export type CaseStudyRow = z.infer<typeof CaseStudyRow>;
export const CASE_TAG = 'case-studies';

/** Only rows that clear every integrity rule. Rows failing zod (e.g. an unsourced result) are dropped, not shown. */
export const getPublishedCaseStudies = unstable_cache(
  async (): Promise<CaseStudyRow[]> => {
    const { data, error } = await createServiceClient()
      .from('case_studies')
      .select('*')
      .eq('published', true)
      .eq('verified', true)
      .eq('is_seed', false)
      .order('published_at', { ascending: false });
    if (error) throw new Error(`case studies fetch failed: ${error.message}`);
    return (data ?? []).flatMap((r) => {
      const parsed = CaseStudyRow.safeParse(r);
      return parsed.success ? [parsed.data] : [];
    });
  },
  ['case-studies:list'],
  { tags: [CASE_TAG], revalidate: 3600 },
);

export async function getPublishedCaseStudy(slug: string): Promise<CaseStudyRow | null> {
  return (await getPublishedCaseStudies()).find((c) => c.slug === slug) ?? null;
}
