"use client";

import { useMemo, useState } from "react";
import {
  useQueryState,
  useQueryStates,
  parseAsArrayOf,
  parseAsString,
  parseAsInteger,
  parseAsBoolean,
  parseAsStringLiteral,
} from "nuqs";
import { Search, SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/Field";
import { WorkflowCard } from "@/components/catalog/WorkflowCard";
import { Button } from "@/components/ui/Button";
import { catalogSeed } from "@/data/catalog-seed";
import type { CategorySlug, IntegrationSlug } from "@/types/domain";

const CATEGORIES: { slug: CategorySlug; label: string }[] = [
  { slug: "facebook-crm", label: "Facebook & CRM" },
  { slug: "lead-generation", label: "Lead Generation" },
  { slug: "social-media", label: "Social Media" },
  { slug: "e-commerce", label: "E-Commerce" },
  { slug: "ai-llm", label: "AI & LLM" },
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const SETUP_BUCKETS = [
  { id: "under-15", label: "< 15 min", max: 15 },
  { id: "15-30", label: "15–30 min", min: 15, max: 30 },
  { id: "30-plus", label: "30+ min", min: 30 },
] as const;

const SORT_OPTIONS = [
  { value: "popularity", label: "Popularity" },
  { value: "latest", label: "Latest" },
  { value: "roi", label: "Highest ROI Saved" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;

const PAGE_SIZE = 12;

const allIntegrations = Array.from(new Set(catalogSeed.flatMap((w) => w.integrations))).sort();
const PINNED_INTEGRATIONS: IntegrationSlug[] = [
  "facebook-messenger",
  "openai",
  "google-sheets",
  "shopify",
  "airtable",
  "telegram",
];

export function CatalogExplorer() {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [filters, setFilters] = useQueryStates({
    cat: parseAsArrayOf(parseAsString).withDefault([]),
    integrations: parseAsArrayOf(parseAsString).withDefault([]),
    difficulty: parseAsArrayOf(parseAsString).withDefault([]),
    setup: parseAsArrayOf(parseAsString).withDefault([]),
    vip: parseAsBoolean.withDefault(false),
    priceMax: parseAsInteger.withDefault(200),
  });
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORT_OPTIONS.map((s) => s.value)).withDefault("popularity"),
  );
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [showAllIntegrations, setShowAllIntegrations] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let results = catalogSeed;

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      results = results.filter((w) =>
        [w.title, w.summary, ...w.tags, ...w.integrations].join(" ").toLowerCase().includes(needle),
      );
    }
    if (filters.cat.length > 0) {
      results = results.filter((w) => w.categories.some((c) => filters.cat.includes(c)));
    }
    if (filters.integrations.length > 0) {
      results = results.filter((w) => w.integrations.some((i) => filters.integrations.includes(i)));
    }
    if (filters.difficulty.length > 0) {
      results = results.filter((w) => filters.difficulty.includes(w.difficulty));
    }
    if (filters.setup.length > 0) {
      results = results.filter((w) =>
        filters.setup.some((bucketId) => {
          const bucket = SETUP_BUCKETS.find((b) => b.id === bucketId);
          if (!bucket) return false;
          if ("min" in bucket && bucket.min !== undefined && w.setupMinutes < bucket.min) return false;
          if ("max" in bucket && bucket.max !== undefined && w.setupMinutes >= bucket.max) return false;
          return true;
        }),
      );
    }
    if (filters.vip) {
      results = results.filter((w) => w.vipIncluded);
    }
    results = results.filter((w) => w.price.amountCents / 100 <= filters.priceMax);

    const sorted = [...results];
    switch (sort) {
      case "latest":
        sorted.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
      case "roi":
        sorted.sort((a, b) => b.roiHoursPerWeek - a.roiHoursPerWeek);
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price.amountCents - b.price.amountCents);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price.amountCents - a.price.amountCents);
        break;
      default:
        sorted.sort((a, b) => b.popularityScore - a.popularityScore);
    }

    return sorted;
  }, [q, filters, sort]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;
  const activeFilterCount =
    filters.cat.length +
    filters.integrations.length +
    filters.difficulty.length +
    filters.setup.length +
    (filters.vip ? 1 : 0);

  function toggleArrayFilter(key: "cat" | "integrations" | "difficulty" | "setup", value: string) {
    const current = filters[key];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    void setFilters({ [key]: next.length > 0 ? next : null, page: null } as never);
    void setPage(1);
  }

  function clearAll() {
    void setFilters({ cat: null, integrations: null, difficulty: null, setup: null, vip: null, priceMax: null });
    void setQ(null);
    void setPage(null);
  }

  const integrationList = showAllIntegrations
    ? allIntegrations
    : PINNED_INTEGRATIONS.filter((i) => allIntegrations.includes(i));

  const sidebar = (
    <div className="flex flex-col gap-6">
      <div>
        <label htmlFor="catalog-search" className="sr-only">
          Search workflows
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="catalog-search"
            type="search"
            value={q}
            onChange={(event) => {
              void setQ(event.target.value || null);
              void setPage(1);
            }}
            placeholder="Search workflows, apps, or outcomes…"
            className="h-10 w-full rounded-xl border border-line/70 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Category</p>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => {
            const count = catalogSeed.filter((w) => w.categories.includes(cat.slug)).length;
            return (
              <Checkbox
                key={cat.slug}
                label={`${cat.label} (${count})`}
                checked={filters.cat.includes(cat.slug)}
                onChange={() => toggleArrayFilter("cat", cat.slug)}
              />
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Price</p>
        <input
          type="range"
          min={0}
          max={200}
          step={5}
          value={filters.priceMax}
          onChange={(event) => {
            void setFilters({ priceMax: Number(event.target.value) });
            void setPage(1);
          }}
          className="slider-track h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2"
        />
        <p className="mt-1 text-xs text-muted">Up to ${filters.priceMax}</p>
        <Checkbox
          label="Included with VIP Pass"
          checked={filters.vip}
          onChange={() => {
            void setFilters({ vip: !filters.vip || null });
            void setPage(1);
          }}
          className="mt-2"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Integrations</p>
        <div className="flex flex-col gap-2">
          {integrationList.map((slug) => (
            <Checkbox
              key={slug}
              label={slug.replace(/-/g, " ")}
              className="capitalize"
              checked={filters.integrations.includes(slug)}
              onChange={() => toggleArrayFilter("integrations", slug)}
            />
          ))}
        </div>
        {allIntegrations.length > PINNED_INTEGRATIONS.length ? (
          <button
            type="button"
            onClick={() => setShowAllIntegrations((v) => !v)}
            className="mt-2 text-xs font-medium text-violet-600 hover:underline"
          >
            {showAllIntegrations ? "Show fewer" : "Show more"}
          </button>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Difficulty</p>
        <div className="flex flex-col gap-2">
          {DIFFICULTIES.map((d) => (
            <Checkbox
              key={d}
              label={d}
              className="capitalize"
              checked={filters.difficulty.includes(d)}
              onChange={() => toggleArrayFilter("difficulty", d)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Setup time</p>
        <div className="flex flex-col gap-2">
          {SETUP_BUCKETS.map((bucket) => (
            <Checkbox
              key={bucket.id}
              label={bucket.label}
              checked={filters.setup.includes(bucket.id)}
              onChange={() => toggleArrayFilter("setup", bucket.id)}
            />
          ))}
        </div>
      </div>

      {activeFilterCount > 0 || q ? (
        <button
          type="button"
          onClick={clearAll}
          className="text-left text-sm font-medium text-violet-600 hover:underline"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block">{sidebar}</aside>

      <div>
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-line/70 px-3.5 py-2 text-sm font-medium"
          >
            <SlidersHorizontal aria-hidden="true" size={16} />
            Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
          </button>
          <select
            value={sort}
            onChange={(event) => void setSort(event.target.value as (typeof SORT_OPTIONS)[number]["value"])}
            className="rounded-xl border border-line/70 px-3 py-2 text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {mobileFiltersOpen ? (
          <div className="mt-4 rounded-xl border border-line/70 p-4 lg:hidden">{sidebar}</div>
        ) : null}

        <div className="mt-4 hidden items-center justify-between lg:flex">
          <p aria-live="polite" className="text-sm text-ink-2">
            Showing {visible.length} of {filtered.length} workflows
          </p>
          <select
            value={sort}
            onChange={(event) => void setSort(event.target.value as (typeof SORT_OPTIONS)[number]["value"])}
            className="rounded-xl border border-line/70 px-3 py-2 text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p aria-live="polite" className="mt-2 text-sm text-ink-2 lg:hidden">
          Showing {visible.length} of {filtered.length} workflows
        </p>

        {filtered.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line py-16 text-center">
            <p className="text-sm font-medium text-ink-2">No workflows match those filters.</p>
            <div className="flex gap-3">
              <Button size="sm" variant="secondary-outline" onClick={clearAll}>
                Clear filters
              </Button>
              <Button asChild size="sm">
                <a href="/services#quote">Request a custom workflow</a>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
            </div>
            {hasMore ? (
              <div className="mt-8 text-center">
                <Button variant="secondary-outline" onClick={() => void setPage((page ?? 1) + 1)}>
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
