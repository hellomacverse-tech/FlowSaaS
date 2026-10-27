# FlowSaaS

Production-ready n8n workflow marketplace: templates, an all-access VIP pass,
done-for-you managed setups, and browser-run Micro-SaaS tools. Built with
Next.js 15 (App Router), TypeScript strict mode, Tailwind CSS v4, and
Supabase.

This repository is being built in the 8 phases defined in the project spec
(Section 17). **This delivery covers Phases 1–6: Foundation, Marketing core,
Catalog & product, Commerce & entitlements, n8n runtime, and the Dashboard.**

## What's in Phase 6

- **Real dashboard shell**: a desktop sidebar (icon rail at `md`, full labels
  at `lg`+), a mobile bottom tab bar, a top bar with a live credits pill and
  an avatar menu, and an upgrade card pinned for free-tier users — replacing
  Phase 4/5's bare header-only layout.
- **Overview** (Section 9.5): a credits ring that shifts color at 80%/95%
  used (fixed a latent SVG gradient-id collision bug in `ProgressRing` so
  multiple rings can render on the same page), an Account Info card with
  license-key reveal/copy/**regenerate** (new route, confirms before
  invalidating the old key), a 14-day usage chart, recent runs, and quick-
  launch tiles.
- **Usage Statistics** (`/app/usage`): the same SVG bar chart at a larger
  size with a 7/14/30-day toggle (sliced client-side from one 30-day
  server fetch — no extra round trip), a by-tool breakdown table, a recent-
  failures list, and CSV export.
- **`UsageBarChart`**: rounded-top gradient bars, today always at full
  height, a coral dot over any bar with a failure, at most 3 dotted
  reference lines, and a visually-hidden `<table>` carrying the same data
  for screen readers (Section 9.5's explicit a11y requirement).
- Zero-filled usage data (`lib/dashboard/usage.ts`): a day with no runs is
  a real visible zero bar, not a gap in the array.

### Known gaps in Phase 6

- **Library and Billing keep their Phase 4/5 functionality as-is** rather
  than gaining the extra polish Section 9.5 describes for them (changelog
  accordion on Library, invoices list and credit-pack purchase on Billing).
  Both already work (real downloads, real Stripe Portal access) — this is
  missing refinement, not missing function, and is the natural pickup for a
  short follow-up pass.
- Same as Phase 5: nothing here has run against a live Supabase project, so
  the dashboard's queries are typechecked and structurally consistent with
  the schema but not integration-tested against real data.

## What's in Phase 5

Phase 5 is almost entirely new infrastructure rather than new pages: request
signing, a real sandbox backend, Micro-SaaS tools with atomic credit
accounting, Deploy-to-instance, and the security primitives (SSRF guard,
encryption, PII scrubbing, Turnstile) everything else sits on top of.

- **Request signing** (`lib/n8n/sign.ts`, Section 7.2): HMAC-SHA256 over
  `timestamp.nonce.rawBody`, ±60s skew, nonce replay protection
  (Redis `SET NX EX` in production, in-memory for tests). The **n8n side of
  the contract is a literal string of Code-node JavaScript**
  (`lib/n8n/verify-node.ts`) executed in tests against headers produced by
  the actual signer — the two halves of the protocol are tested against each
  other, not against a description of each other.
- **SSRF guard, properly** (`lib/security/ssrf.ts` + `safe-fetch.ts`,
  Section 7.4): HTTPS-only, DNS-resolved, every private/loopback/link-local
  range blocked (including the 169.254.169.254 cloud metadata address and
  IPv4-mapped IPv6 forms like `::ffff:127.0.0.1`), redirects never followed,
  5s timeout — and a **second layer at actual connect time** via a custom
  `undici` DNS lookup, because a pre-flight check alone loses to DNS
  rebinding (name resolves public for the check, private by the time the
  socket opens). Used everywhere a stored or user-supplied URL is fetched:
  connecting an instance, testing one, and deploying to one.
- **AES-256-GCM** (`lib/crypto.ts`) for n8n API keys; **PII scrubbing**
  (`lib/pii.ts`) strips control characters and redacts emails/phone numbers
  before sandbox input reaches storage or any LLM.
- **Live Sandbox, actually working** (Sections 7.3 / 9.1.3 / 9.3): `POST
  /api/sandbox/run` (Turnstile → rate limit → zod → PII-scrub → insert
  `queued`) and `GET /api/sandbox/stream/[runId]` (SSE, with an automatic
  poll fallback the same endpoint serves via `?poll=1`). An `N8N_MODE=mock`
  / `live` switch controls what runs behind it:
  - **mock** (the default — no n8n needed, for dev/CI/demos): progress is a
    **pure function of elapsed time**, so any instance can answer any poll
    identically with no background worker and no writes while streaming.
  - **live**: signs and POSTs to real n8n, which reports progress back via
    `POST /api/webhooks/n8n` (same signing contract, same nonce store); a
    15-second ceiling is enforced independently of n8n ever calling back.
  - Both the home page's `LiveSandbox` and the per-workflow
    `WorkflowSandboxPreview` now call this for real — the Phase 2/3
    `setTimeout`-based local simulations are gone.
- **Micro-SaaS tools** (Section 7.5): the 5 launch tools as real JSON
  Schemas (`data/tools.ts`) validating both directions — input before an
  execution is spent, output before credits are charged. `runTool()`
  (`lib/tools/run-tool.ts`) is the one service behind both `POST
  /api/tools/{slug}/run` (session) and `POST /api/v1/run` (Bearer key):
  load → validate input (422) → check credits (402) → call tool → validate
  output → charge, atomically. A dedicated Postgres function
  (`record_tool_run`, migration 0003) does the charge-and-log as one
  row-locked transaction, so two concurrent requests can't both spend the
  last credit — and **failed, timed-out, or schema-invalid runs are
  recorded with 0 credits charged**, enforced in code and tested across
  every failure branch. `N8N_MODE=mock` runs the five tools against
  deterministic, clearly-labeled sample logic (`lib/tools/mock.ts`); `live`
  signs and calls real n8n webhooks with one retry on 502/503.
- **`Idempotency-Key` support** (`lib/idempotency.ts`, 24h, Redis-backed):
  a retried request with the same key replays the stored response instead
  of running (and charging) twice; a concurrent duplicate gets 409.
- **Deploy to My n8n Instance** (Section 7.4): connect
  (`POST /api/instances`, SSRF-guarded + live-verified + encrypted before
  storage), re-verify (`POST /api/instances/[id]/test`), and deploy
  (`POST /api/deploy`) — which re-validates the entitled JSON immediately
  before sending it (allowlisted node types, no `executeCommand`/`ssh`, no
  embedded credentials, size cap), forces `active:false`, and returns a
  credentials checklist. A 10-minute signed **import-URL** alternative
  (`POST /api/import-token` → `GET /api/import/[token]`) covers n8n's
  "Import from URL" for people without a connected instance.
- **Real dashboard pages this phase needed**: `/app/tools` (list + an
  auto-generated form **driven directly by each tool's JSON Schema** +
  result panel with copy/CSV/history + a working curl/JS snippet),
  `/app/api-keys` (create — shown once — list, revoke), and `/app/instances`
  (connect, list, test, remove) — real functionality, not the Phase 6 shell.
- **Turnstile wired everywhere it was previously a stub**: the sandbox, the
  quote form, and the booking form all load the real widget and are
  verified server-side (fail-closed on a missing token, a network error, or
  Cloudflare saying no). `.env.example` ships Cloudflare's public
  always-passes **test** keys so local dev doesn't need a real Turnstile
  site to be functional.
- **113 new tests (146 total)**, almost entirely against the pure logic
  rather than mocked HTTP: 54 security tests (encryption round-trip +
  tamper detection, PII scrubbing, 19 SSRF cases including DNS-rebinding-
  style address mixing, the signing protocol including the **n8n Code node
  executed for real**, import tokens, API keys, Turnstile fail-closed
  behavior, idempotency races), 25 tool tests (schema validation, mock
  output satisfying its own schema, every `runTool` branch including the
  race-lost-the-charge case), and 15 runtime tests (sandbox mock
  progression as a pure function of time, n8n callback merging, deploy
  preparation against a real generated launch workflow file).

### Fixed while building Phase 5

- **The browser Supabase client imported the server-validated `env` module**
  (set up in Phase 4), which validates server secrets that don't exist in a
  browser bundle — importing it from client code throws at runtime. It now
  reads the two `NEXT_PUBLIC_*` vars directly.
- **Raw `fetch()` instead of the SSRF-guarded `safeFetch()`** in the first
  draft of the instance-connect and instance-test routes — the
  `assertPublicUrl` pre-check alone doesn't close the DNS-rebinding gap;
  both routes (and deploy) now go through `safeFetch`.

### Known gaps / deviations in Phase 5

- **Never run against real n8n.** `N8N_MODE=mock` is the default and what
  every test exercises; `live` mode's signing, retry, and timeout logic
  is unit-tested against a fake `fetch`, but there is no actual n8n
  instance in this environment to point it at. The n8n-side Code node
  (`lib/n8n/verify-node.ts`) is tested by executing its literal source, which
  is the closest this environment can get to an integration test without a
  running n8n.
- **SSE on serverless hosting**: `/api/sandbox/stream` holds a connection
  open with a `setInterval`, which works on a long-lived Node process but
  needs the poll fallback (already built) on a platform that caps function
  duration. Deploying to Vercel specifically may need `export const
  maxDuration` tuning or defaulting to the poll path.
- **The "Deploy to My n8n Instance" UI is sequential, not a 3-tab modal.**
  Section 7.4 describes one dialog with Connect/Download/Copy-URL tabs; this
  build has three real, working flows (`DeployButton`'s inline instance
  picker, the existing Download JSON button, and a "copy import URL" link)
  rather than unifying them into a single modal — a disclosed UI
  simplification, not a missing capability.
- **Credit packs aren't purchasable yet** — `profiles.credits_included`
  only reflects the free/VIP tier amounts from Phase 4's Stripe webhook.
  Section 8.2's one-time credit-pack checkout is a small addition to that
  existing webhook handler, not new infrastructure, and was left for
  whichever phase actually surfaces it in the UI.
- **pg_cron scheduling for `purge_old_sandbox_runs()`** (30-day sandbox
  input retention, Section 15.2) is defined as a plain function in migration
  0003 with the `cron.schedule(...)` call as a comment — pg_cron needs to be
  enabled per-project in the Supabase dashboard, which isn't something a
  migration file can do.
- **Turnstile's test keys always pass.** `.env.example` ships Cloudflare's
  documented test site/secret key pair so the forms are actually usable in
  local dev without a real Turnstile account; replace both before launch.

## What's in Phase 4

- **Auth** (Section 8.1): Supabase Auth with email magic link + Google + GitHub.
  Real split-screen `/login` and `/signup` (form card left, animated workflow
  illustration right, hidden below `lg`), an `/auth/callback` code-exchange
  route handler, browser and server Supabase clients, and sign-out. The
  `middleware.ts` session refresh + `/app/**` gate from Phase 1 now has real
  sessions behind it. A DB trigger (migration 0001) already creates the
  profile + license key on signup.
- **Payments behind a `PaymentProvider` interface** (Section 2.1): a Stripe
  implementation, plus a LemonSqueezy stub with the same interface (throws
  "not implemented" — it exists to prove the switch is additive).
- **`POST /api/checkout`**: one-time workflow purchases (`mode: payment`) and
  VIP subscriptions (`mode: subscription`, 7-day trial), with automatic tax,
  promo codes, and `client_reference_id` for signed-in buyers. Anonymous
  buyers check out by email.
- **`POST /api/webhooks/stripe`**: signature-verified and idempotent (each
  `event.id` is claimed in `stripe_events`; a failed handler releases the
  claim so Stripe's retry can succeed). Handles `checkout.session.completed`,
  `customer.subscription.created|updated|deleted`, `invoice.payment_failed`,
  `charge.refunded` and `charge.dispute.created`. Anonymous purchasers get an
  auth user created from their checkout email (Section 8.2), and a
  **refund deletes the purchase entitlement** so future downloads fail
  (already-downloaded files can't be recalled — stated on `/refunds`).
  Handlers live in `lib/webhooks/stripe-handlers.ts` so they're unit-testable.
- **Entitlements** (`lib/entitlements.ts`): specific purchase OR all-access
  (`workflow_id IS NULL`, VIP/DFY) with expiry, preferring the more specific
  source; fails closed on any DB error.
- **`GET /api/download/[workflowId]`** (Section 8.3): auth → entitlement →
  10/hr/user limit → 60-second signed Storage URL → `downloads` log → 302.
- **`GET /api/entitlements/[slug]`** + a client-side `PurchaseBox` that shows
  real owned / not-owned state (Buy Now and Start VIP Trial call checkout;
  owned shows Download JSON). Ownership is fetched after mount, deliberately,
  so product pages stay **statically generated / ISR** (Section 2.2) instead of
  being forced dynamic by a cookie read for one personalised widget.
- **Purchase success page** (`/checkout/success`): retrieves the Stripe
  session server-side, shows workflow vs. VIP confirmation, a direct download
  button if signed in, or a "check your email to sign in" note if not.
- **Minimal `/app`** (Library with real download buttons and license key,
  Billing with real tier/trial/renewal + Stripe Customer Portal button,
  Overview, and an honest Instances stub). The full sidebar dashboard is
  Phase 6; only what the purchase → download and subscription flows need is
  built here.
- **Emails**: purchase receipt (with license key) and VIP welcome, in
  `lib/email.ts`.
- **The 12 downloadable workflow files** (`n8n/workflows/*.json` +
  `manifest.json`) plus `lib/n8n/validate.ts` — an allowlist validator that
  rejects `credentials` blocks, `executeCommand`/`ssh` nodes, unlisted node
  types, `pinData` and files over 1 MB. `pnpm generate:workflows` builds them;
  `pnpm sanitize:workflows` is the release gate (validates every file and
  checks its sha256 against the manifest). The same validator is what Phase
  5's Deploy-to-instance route will re-run.
- **`pnpm seed` now seeds the `workflows` table** and everything hanging off
  it (categories/integrations junctions, node docs, how-to steps, per-workflow
  FAQs), uploads each JSON to the private `workflow-json` bucket, and writes
  `workflow_versions` with sha256 — from the same TypeScript content the pages
  render, so there's one source of truth rather than a second `workflows.json`
  to drift. (This was a real gap: checkout and entitlements need actual
  `workflows` rows to reference.)
- 33 new tests (50 total): entitlement logic (specific / all-access /
  precedence / fail-closed), refund → revoke, anonymous-buyer user resolution,
  checkout schema, the payment adapter, and full n8n validation including a
  release-gate test over all 12 generated files.

### Fixed while building Phase 4

- **Broken OG image URLs on every product page (Phase 3 bug).** Next appends a
  content hash to file-convention OG routes (`opengraph-image-13ab4p`), but the
  page metadata and JSON-LD referenced the un-hashed URL, so `og:image` and
  schema `image` would 404. OG cards are now served from a stable route
  (`/og/workflows/[slug]`) and I verified in the build output that the emitted
  URL matches a generated asset.
- **Stripe SDK / API drift**: bumped `stripe` to 22.6.2 (API `2026-08-26`), which
  moved `current_period_end` onto subscription items and replaced
  `invoice.subscription` with `invoice.parent.subscription_details`; the webhook
  code reflects the current shapes.

### Known gaps / deviations in Phase 4

- **Nothing here has touched live Stripe, Supabase, Resend or Upstash.** This
  sandbox can't reach them. The logic is unit-tested against fakes and the
  whole app type-checks and builds, but the exit criterion "end-to-end test
  purchase → download; refund revokes access" has **not** been run for real.
  Run it in Stripe test mode (`stripe listen --forward-to
  localhost:3000/api/webhooks/stripe`) before trusting it.
- **The 12 workflow JSON files are generated skeletons, not exports from a
  tested n8n instance.** They have correct node types, positions, a linear
  connection chain, per-node notes, a setup sticky note, and no credentials —
  but node `parameters` are intentionally minimal. Do not sell them as-is:
  replace each with a real, tested export and re-run `pnpm sanitize:workflows`.
- **One-time prices use Stripe `price_data`**, not pre-created Price objects
  from an admin script (Section 8.2). Equally valid Stripe usage with no sync
  step; VIP still uses real pre-created price IDs from env.
- **Checkout is keyed by workflow `slug`, not UUID**, because the static
  content layer has no DB ids; the route resolves the real id server-side.
- **Not built: credit packs, and DFY invoicing/quotes-as-Stripe-invoices.**
  Credit packs belong with the Micro-SaaS runtime (Phase 5); DFY is sold via
  quotes per Section 8.2.
- **VIP welcome email trigger is a heuristic** (a subscription update with a
  future `trial_end`), so it can re-fire if Stripe sends another update during
  the trial. Storing a "welcome sent" flag on the subscription row is the
  proper fix.
- **Email deliverability**: `FROM` uses `notifications@{site host}`; that domain
  must be verified in Resend.
- Login/signup need the Google/GitHub OAuth apps and the site URL configured in
  the Supabase dashboard; nothing in code can do that for you.

## What's in Phase 3

- **`/workflows`**: the full filter/sort/search experience (Section 9.2.1)
  — search, category checkboxes with live counts, a price slider + VIP
  toggle, integrations checkboxes (pinned six + "show more"), difficulty
  and setup-time filters, 5-way sort, a "Showing X of Y" live region, and
  "Load more" pagination — all state lives in the URL via `nuqs`, so every
  filter combination is a shareable link. Deliberately kept **statically
  generated** per Section 2.2 rather than trading that away to noindex
  filtered URLs server-side (see "Known gaps" below).
- **Quick-view modal**: a real Next.js intercepting route
  (`@modal/(.)workflows/[slug]`) — clicking a card's eye icon opens a
  focus-trapped `Dialog` over the catalog; a hard refresh or direct link to
  the same URL renders the full product page instead. This needed a new
  `Modal` component (focus trap, Esc, scroll lock, returns focus) and a
  parallel-route slot added to the marketing layout.
- **Full product page** (`/workflows/[slug]`, Section 9.3) for all 12
  launch workflows:
  - A **server-rendered, zero-JS static SVG** workflow graph
    (`WorkflowGraphSvg`) with a thin client overlay (`WorkflowGraphInteractive`)
    adding hover tooltips, click-to-scroll-to-the-Nodes-row, zoom in/out/fit,
    and a "Play walkthrough" that steps through the graph with a live caption
  - A compact **sandbox preview** that steps through the workflow's own
    real node list (see "Known gaps" for why this replaced 12 hand-authored
    scenario configs) — or an honest "demo video coming soon" state for the
    three workflows without sandbox support
  - Four real tabs (How It Works & Architecture, Video/Setup Guide, Nodes &
    API Docs, Reviews), hash-synced, all panels always in the DOM
  - A `PurchaseBox` with real system requirements, pricing, and trust strip
    (always the non-owned state — entitlements don't exist until Phase 4)
  - Related workflows (shared category) and a per-workflow FAQ accordion
  - The full `@graph` JSON-LD (`SoftwareApplication`+`Product`+`Offer`+
    `HowTo`+`FAQPage`+`BreadcrumbList`), **omitting `aggregateRating`
    entirely** since zero workflows have verified reviews yet — unit-tested
  - A real per-workflow 1200×630 OG image generated with `next/og`
- **Full authored content for all 12 launch workflows** (Section 10):
  subtitle, problem/solution description, a real node list (concise but
  specific — not generic filler), 4–6 how-to steps, 4 FAQs each, and
  auto-derived requirements from each workflow's integrations. 143 node
  entries and 48 workflow-specific FAQs in total.
- **`/categories/[slug]`** (Section 9.10): 5 category hub pages with a
  unique 120–160 word intro, a filtered grid, category-specific FAQ, and
  related-category links.
- New reusable UI kit pieces this phase needed: `Tabs`, `Modal`,
  `CodeBlock`, `Breadcrumbs` — completing the Section 3.8 component list
  that Phase 1 deliberately deferred.
- 4 new unit tests (17 total): the workflow schema builder correctly omits/
  includes `aggregateRating`, produces one `HowToStep` per how-to step and
  one `Question` per FAQ, and every one of the 12 workflows' authored
  content passes basic structural validation (nodes/steps/faqs non-empty,
  graph node count matches, edge count is `nodes - 1`).

## Known gaps / deviations introduced in Phase 3

- **The sandbox preview steps through each workflow's real node list**
  rather than 12 hand-authored scenario configs (steps, presets, a preview
  payload) like the home page's three demos. This is a deliberate
  architecture choice, not a shortcut forced by time: it's more honest (the
  "steps" shown are the literal nodes documented in the Nodes tab, not a
  separate invented narrative) and it scales to all 12 workflows without
  scoping down which ones get a real demo. The trade-off is a less
  narratively-polished animation than the home page's three scenarios.
- **`/workflows` stays statically generated and always indexable**,
  meaning the "noindex filtered URLs" rule from Section 9.2.1 isn't
  enforced yet. Enforcing it via `generateMetadata` would read
  `searchParams` and force the entire route to render dynamically per
  request — directly contradicting Section 2.2's "SSG shell" requirement
  for this exact route. The correct fix is an edge-middleware
  `X-Robots-Tag` rule keyed on query-string presence, which belongs in
  Phase 7 (technical SEO) alongside `robots.ts`/`sitemap.ts`, not bolted
  onto this page in isolation.
- **The workflow graph's node layout is auto-generated** (a serpentine
  left-to-right grid, Section: `lib/workflow-graph.ts`) rather than
  hand-positioned per workflow. It reads clearly for the mostly-linear
  chains these templates actually are, but a workflow with a genuine
  multi-branch structure would benefit from a hand-tuned layout — the
  `graphOverrides` map in `data/workflow-details.ts` is where that would
  plug in.
- **No setup videos exist**, so `video: null` for all 12 workflows and the
  Video Guide tab shows an honest "coming soon" state next to the real
  numbered how-to steps, rather than a fabricated video URL/duration
  (Section 16 content-integrity: claims must be true).
- **The product page's "sticky bottom purchase bar" on mobile** (Section
  9.3's layout note for `< lg`) isn't implemented — the purchase box just
  flows into the single-column layout below the content instead of pinning
  to the viewport bottom.
- **Zoom/pan on the graph is scale-only** (buttons set a CSS width
  percentage); there's no drag-to-pan.

## What's in Phase 2

- **Home page, all 9 sections** (Section 9.1): Hero (Phase 1) plus Metrics
  band, Live Sandbox, 4-Tier model, Catalog preview, ROI calculator,
  Testimonials/Case studies (seed-gated), FAQ (with matching `FAQPage`
  JSON-LD), and the Final CTA
- **Live Sandbox** (`components/home/LiveSandbox.tsx`): all six states
  (idle, queued, running with a step timeline + progress ring, success with
  Preview/JSON/Timeline tabs, error, rate-limited), all three scenarios.
  Runs against a **local simulated runner** — the real signed n8n webhook +
  SSE stream (Section 7.3) is Phase 5; this is a clearly-scoped
  substitution, not a shortcut on the UI itself
- **ROI calculator** (`components/home/RoiCalculator.tsx`, shared by home
  and the future `/roi-calculator` page): the exact Section 9.6 formula
  (`lib/roi.ts`, unit-tested), URL-synced state, animated output, advanced
  coverage slider
- **`/workflows`**: the 12-workflow launch catalog (`data/catalog-seed.ts`,
  authored from Section 10) rendered as real `WorkflowCard`s — filtering,
  sorting, search, and the quick-view modal (Section 9.2.1) are Phase 3
- **`/workflows/[slug]`**: a stub product page with real title/summary/price
  per workflow, so catalog links resolve; the full graph/tabs/purchase-box
  build (Section 9.3) is Phase 3
- **`/services`**: full hero, 4-step process, DFY packages, and a working
  **Book a Call / Request a Quote** widget — a real month-grid booking
  calendar backed by actual `booking_slots` rows (seeded 14 weekdays out),
  atomic slot reservation (race-condition-safe, see the migration below),
  and a validated quote form. **Both forms actually insert into Supabase
  and send email via Resend** (Section 17's Phase 2 exit criteria: "forms
  persist leads & send emails")
- **`/pricing`**: 4 tier cards, comparison table, money-back guarantee,
  pricing FAQ, `FAQPage` schema
- **`/enterprise`**: capability grid, security section, compliance roadmap,
  engagement model, and the same quote form
- **Legal pages** (`/privacy`, `/terms`, `/refunds`, `/security`): real,
  substantive policy content — not placeholders — covering GDPR/CCPA
  rights, subprocessors, the 14-day refund policy, and security practices
- New API routes: `POST /api/leads/quote`, `POST /api/bookings`,
  `GET /api/booking-slots` — zod-validated, honeypot-checked, rate-limited
  (Upstash), with a real Postgres function (`book_slot`, migration 0002)
  for atomic slot reservation
- `lib/email.ts` (Resend), `lib/ratelimit.ts` (Upstash), `lib/hash.ts`
  (HMAC IP hashing), `lib/supabase/service.ts` (service-role client),
  `lib/ics.ts` (calendar-file generation)
- 9 new unit tests (13 total): the ROI formula plus full coverage of the
  quote/booking zod schemas (valid submissions, missing consent, short
  project details, bad email, bad enum, UUID validation)

## Known gaps / deviations from a literal reading of the spec

- **First-load JS is over budget on a few routes**: `/` is ~124 kB,
  `/services` ~144 kB, `/enterprise` ~137 kB, against Section 12's 120 kB
  target. The heaviest pieces (sandbox, ROI calculator, booking calendar,
  quote form with react-hook-form + zod) are exactly what Section 12 asks
  to defer via `next/dynamic` + IntersectionObserver — but a plain
  `next/dynamic(..., { ssr: true })` doesn't reduce this metric (the
  component still has to be ready for the initial server render), so doing
  this properly needs a client wrapper that mounts an `ssr: false` import
  only after intersection. That's real interaction-cost work best done
  once Phase 6's dashboard charts exist too, so it's one pass across every
  heavy island rather than three separate ones. Flagging it now rather
  than silently leaving it for later.
- **Turnstile isn't actually verified yet**: the quote/booking routes have
  a `TODO(Phase 4/5)` where the `challenges.cloudflare.com/turnstile/v0/siteverify`
  call belongs, and no client Turnstile widget is mounted on the forms
  yet. Both routes work correctly without it (rate limiting is real); this
  is a bot-protection gap, not a functional one.
- **Emails are plain HTML template literals, not React Email components.**
  The spec calls for "Resend + React Email templates." Three working
  templates exist (`lib/email.ts`) and actually send, but as hand-written
  HTML strings rather than `@react-email/components`. Swapping in React
  Email is additive — the call sites don't change — so it's a reasonable
  place to have simplified for now.
- **Booking calendar's timezone override is a plain `<select>` of nine
  common zones**, not the searchable combobox implied by "timezone…with a
  searchable override." Detection via `Intl.DateTimeFormat` and the
  correctness of the actual booking (slot storage in UTC, display
  conversion) are both real; only the picker UI is simplified.
- **Case-study "Read the story →" has no destination yet.** Individual
  case-study pages with `Article` schema are explicitly Phase 7 (pSEO)
  scope in the spec; the card says so rather than linking somewhere
  misleading.
- **`IntegrationSlug` gained two members** (`google-places`, `rss`) not in
  the original Section 6 enum, needed because launch workflows #4 and #7
  (Section 10) reference integrations the base enum didn't include.
  Section 6 explicitly permits extending this type.
- The Enterprise contact form reuses the standard `QuoteForm` rather than
  a variant with dedicated "Team size" and "Compliance requirements"
  fields (Section 9.8) — the copy above the form asks people to fold that
  into the free-text project details field for now.

## What's in Phase 1

- Repo scaffold: Next.js 15 + React 19 + TypeScript strict (`strict`,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), path alias `@/*`
- `src/lib/env.ts` — zod-validated environment variables, fails fast at boot
- Full design system tokens in `src/app/globals.css` (Tailwind v4 `@theme`):
  colors, gradients, shadows, fluid type scale, motion tokens, gradient-sphere
  keyframes, `prefers-reduced-motion` handling
- Core UI kit (`src/components/ui`): `Button`, `Badge`/`Chip`, `Card`,
  `Skeleton`, `ProgressRing`, plus the `Slot` primitive powering `asChild`
- Layout shell: `GradientSpheres`, `Logo`, `Navbar` (scroll shadow via
  `IntersectionObserver`, focus-trapped mobile sheet), `Footer` (with the
  required trademark disclaimer)
- Home page with a fully-built **Hero** section (exact spec copy). The other
  8 home sections (metrics, sandbox, 4-tier model, catalog preview, ROI
  calculator, testimonials, FAQ, final CTA) are Phase 2 — they read from the
  catalog/commerce data that doesn't exist until Phase 3/4
- Stub pages for every route the Navbar/Footer link to (`/workflows`,
  `/services`, `/pricing`, `/enterprise`, `/roi-calculator`, `/tools`,
  `/integrations`, `/changelog`, `/login`, `/signup`, legal pages), so the
  site is fully navigable end to end and `typedRoutes` can validate every
  link. Each stub has real `generateMetadata`, a single `<h1>`, and honest
  "not built yet" copy — see the `phase` line on each page for when it's
  built out
- `/dev/ui` — internal, `noindex`, component showcase (excluded from the
  sitemap once the sitemap is built in Phase 7)
- JSON-LD plumbing: `<JsonLd />` (XSS-safe), `Organization`/`WebSite`/
  `BreadcrumbList` builders, rendered globally in the root layout
- `buildPageMetadata()` — shared `generateMetadata` helper enforcing the
  canonical/OG/robots rules every route follows
- Full Supabase migration (`supabase/migrations/0001_init.sql`): every table
  from the schema, enums, indexes, `updated_at` triggers, a license-key
  generator trigger on new `auth.users` rows, **RLS enabled and policied on
  every table**, and the three storage buckets
- Seed data + idempotent seed script (`pnpm seed`): categories, integrations,
  the 8 home FAQs (verbatim), and the 6 seed testimonials (flagged
  `is_seed: true`, hidden in production per the content-integrity rules)
- `next.config.ts` security headers (CSP, HSTS, etc.), `middleware.ts`
  (Supabase session refresh + `/app` auth gate)
- CI (`.github/workflows/ci.yml`): lint → typecheck → unit tests → build
- One real, spec-required unit test suite: `tests/unit/roi.test.ts`,
  verifying the ROI formula's documented defaults (20 hrs/week, $25/hr →
  80 hours, $2,000/month)
- Generated brand-mark icons (`favicon.svg`, `favicon-32.png`,
  `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `logo-512.png`)
  and a default 1200×630 OG card, all matching the `--gradient-flow` mark

## What's deliberately not in Phase 1

Everything gated behind data that doesn't exist yet: the catalog (Phase 3),
Stripe/entitlements (Phase 4), the n8n sandbox and Deploy-to-instance flow
(Phase 5), the authenticated dashboard (Phase 6), pSEO pages + sitemap/robots
(Phase 7), and the security/monitoring hardening pass (Phase 8). The rest of
the core UI kit listed in Section 3.8 (`Tabs`, `Accordion`, `Modal`,
`Slider`, `Tooltip`, `Toast`, etc.) is built alongside the first page that
actually needs each one, rather than speculatively up front.

## Verified locally

- `pnpm typecheck` — clean
- `pnpm lint` — clean
- `pnpm test` — 146/146 passing (adds 113 tests for signing, SSRF, crypto,
  PII, tools, idempotency, and the sandbox state machine on top of Phases 1–4)
- `pnpm build` — all 70 routes build (20 of them API routes), including 12
  statically-generated workflow product pages and 12 per-workflow OG images. (Verified with `next/font`'s Google Fonts calls temporarily
  stubbed out, since this sandbox's network egress doesn't reach
  `fonts.googleapis.com`; the code itself is unchanged from what's in this
  repo. In any normal environment with internet access — including Vercel
  — `pnpm build` fetches the fonts directly.)
- API routes are correct against the schema and typecheck/build cleanly,
  but **have not been exercised against a live Supabase/Resend/Upstash
  project** — this sandbox has no network path to supabase.co, resend.com,
  or upstash.io. Test them against a real project before relying on them.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in your Supabase/Stripe/n8n/etc. values
pnpm dev
```

Apply both database migrations to a Supabase project, generate the workflow
files, then seed (workflows, downloadable versions, and 14 weekdays of booking
slots for the Services calendar):

```bash
supabase db push                # or paste both supabase/migrations/*.sql files into the SQL editor, in order
pnpm generate:workflows
pnpm seed
```

Visit `/dev/ui` for a live component reference.

### Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright E2E (suite grows with each phase) |
| `pnpm generate:workflows` | Build the 12 sanitized workflow JSONs + manifest |
| `pnpm sanitize:workflows` | Release gate: validate every workflow file + manifest hashes |
| `pnpm seed` | Seed reference data, the 12 workflows (+ Storage uploads/versions), booking slots |
| `N8N_MODE=mock\|live` | Env var: `mock` runs sandbox + tools in-process (default); `live` signs and calls real n8n |

## Deviations from the spec (Section 17 phase-report requirement)

- `tailwindcss` / `@tailwindcss/postcss` are pinned to `4.3.3`, not the
  `4.0.0` implied by "Tailwind CSS v4" — `@tailwindcss/postcss@4.0.0` pulls
  in a newer `@tailwindcss/node` internally, and the version skew between
  the two breaks the PostCSS build (`Missing field "negated" on
  ScannerOptions.sources`). Both packages must stay on the same exact
  version; bump them together.
- `next` is pinned to `15.5.26`, not `15.5.4` — `15.5.4` has a disclosed
  security vulnerability (CVE-2025-66478) patched in a later `15.5.x`
  release.
- Route stub pages added in Phase 1 (`/workflows`, `/services`, etc.) were
  needed to make `typedRoutes` (Section 4) and a fully-clickable Navbar/
  Footer (Section 9.0) both true at the same time. Most are now real pages
  as of Phase 2; `/tools`, `/integrations`, `/changelog`, `/login`,
  `/signup` remain honest "not built yet" stubs pointing at their real
  phase.
- Brand icons and the default OG card are generated programmatically from
  the exact logo geometry/gradient rather than supplied as designer exports,
  since no design source exists yet. Replace with real exports before
  launch if a designer produces one.
- See "Known gaps / deviations" under Phase 2 above for the Turnstile,
  React Email, JS-budget, and timezone-picker simplifications made in this
  phase.

