# Phase 7 integration notes

These files are additive. Apply the following to files this package does NOT overwrite.

## 1. package.json scripts
```json
"audit:pseo": "tsx scripts/audit-pseo.ts",
"audit:pseo:db": "tsx scripts/audit-pseo.ts --source=db",
"audit:links": "tsx scripts/audit-links.ts",
"audit:links:db": "tsx scripts/audit-links.ts --source=db",
"seed:pairs": "tsx scripts/seed-pairs.ts",
"promote:pairs": "tsx scripts/seed-pairs.ts --promote",
"lhci": "lhci autorun"
```
Dev dependencies: `pnpm add -D tsx @lhci/cli`. Scripts read env from the shell; use `tsx --env-file=.env.local scripts/...` locally.

## 2. lib/env.ts
Add `ALLOW_AI_CRAWLERS` (optional, default `"true"`) and `CRON_SECRET` (required in production) to the zod schema and `.env.example`.

## 3. middleware.ts (additive)
After your Supabase session refresh produces `response`:
```ts
import { shouldNoindex } from '@/lib/seo/noindex';
if (shouldNoindex(request.nextUrl.pathname, request.nextUrl.searchParams)) {
  response.headers.set('X-Robots-Tag', 'noindex, follow');
}
```
Make sure the middleware `matcher` includes `/workflows`, `/categories/:path*`, `/integrations`, `/case-studies`.

## 4. globals.css
```css
.cv-auto { content-visibility: auto; contain-intrinsic-size: auto 720px; }
```
Apply to `#models`, `#catalog`, `#proof`, `#faq` only.

## 5. Assets and deletions
- Commit `src/assets/fonts/PlusJakartaSans-800.ttf` and `Inter-500.ttf` (OFL, TTF only; Satori does not read WOFF2).
- If the OG routes cannot find the fonts on Vercel, add `outputFileTracingIncludes: { '/og/**': ['./src/assets/fonts/**'] }` to `next.config.ts`.
- Delete `public/llms.txt` and `src/app/(marketing)/integrations/[pair]/`.

## 6. Wire-up
- Product page: render `<WorksWith pairs={await loadWorksWith(workflow.integrations)} />`.
- Home `#roi` and `#sandbox`: use `RoiCalculatorLazy` / `LiveSandboxLazy` with a server-rendered fallback of the same height.
- Footer / `/integrations`: use `loadTopPairs()`.
- Migration: `supabase db push`, then `pnpm seed:pairs`.

## 7. Assumed names (rename if yours differ)
`@/data/catalog-seed` exports `catalogSeed` with `slug,title,summary,integrations,difficulty,setupMinutes,updatedAt`; `@/components/seo/JsonLd` takes `data`; `@/lib/seo/metadata` exports `buildPageMetadata({ title, description, path, image?, robots? })`; `@/lib/supabase/service` exports `createServiceClient`.
