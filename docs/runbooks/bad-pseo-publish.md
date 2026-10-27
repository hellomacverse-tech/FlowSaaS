# Bad pSEO publish / search traffic drop
1. Identify affected slugs (Search Console > Pages, or `audit:pseo:db`).
2. `update integration_pairs set indexable = false where slug in (...)` (the CHECK allows this).
3. `POST /api/revalidate` with `{"tags":["integrations","catalog"]}` (Bearer CRON_SECRET). They leave the sitemap on next generation.
4. Fix content, get a human review, then `pnpm promote:pairs`.
