"use client";

import { useState } from "react";
import Link from "next/link";
import { Chip } from "@/components/ui/Badge";
import { WorkflowCard } from "@/components/catalog/WorkflowCard";
import { catalogSeed } from "@/data/catalog-seed";
import type { CategorySlug } from "@/types/domain";

const filters: { label: string; value: CategorySlug | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Facebook & CRM", value: "facebook-crm" },
  { label: "Lead Generation", value: "lead-generation" },
  { label: "Social Media", value: "social-media" },
  { label: "E-Commerce", value: "e-commerce" },
  { label: "AI & LLM", value: "ai-llm" },
];

export function CatalogPreview() {
  const [active, setActive] = useState<CategorySlug | "all">("all");

  const filtered = (active === "all" ? catalogSeed : catalogSeed.filter((w) => w.categories.includes(active))).slice(
    0,
    6,
  );

  return (
    <section id="catalog" aria-labelledby="catalog-heading" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-caption text-violet-600">WORKFLOW CATALOG</p>
        <h2 id="catalog-heading" className="text-h2 mt-2 max-w-2xl text-ink">
          Battle-Tested Workflows, Ready to Deploy
        </h2>
        <p className="prose-measure mt-3 text-ink-2">
          Every workflow is versioned, documented, and tested against the latest n8n release.
        </p>

        <div role="tablist" aria-label="Filter workflows by category" className="mt-8 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Chip
              key={filter.value}
              role="tab"
              aria-selected={active === filter.value}
              active={active === filter.value}
              onClick={() => setActive(filter.value)}
            >
              {filter.label}
            </Chip>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/workflows" className="text-sm font-medium text-violet-600 hover:underline">
            View all {catalogSeed.length} workflows →
          </Link>
        </div>
      </div>
    </section>
  );
}
