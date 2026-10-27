import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { WorkflowCard } from "@/components/catalog/WorkflowCard";
import { Accordion } from "@/components/ui/Accordion";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { categories, getCategory } from "@/data/categories";
import { catalogSeed } from "@/data/catalog-seed";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) {
    return buildPageMetadata({
      title: "Category not found",
      description: "This category doesn't exist.",
      path: `/categories/${slug}`,
      indexable: false,
    });
  }

  return buildPageMetadata({
    title: `${category.name} n8n Workflows`,
    description: category.intro.slice(0, 155),
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) {
    notFound();
  }

  const workflows = catalogSeed.filter((w) => w.categories.includes(category.slug));
  const pageUrl = `${siteConfig.url}/categories/${category.slug}`;
  const related = categories.filter((c) => c.slug !== category.slug).slice(0, 4);

  return (
    <section className="py-16 md:py-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "CollectionPage", "@id": `${pageUrl}#collection`, url: pageUrl, name: `${category.name} n8n Workflows` },
            {
              "@type": "ItemList",
              "@id": `${pageUrl}#itemlist`,
              itemListElement: workflows.map((w, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: w.title,
                url: `${siteConfig.url}/workflows/${w.slug}`,
              })),
            },
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}#faq`,
              mainEntity: category.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            },
          ],
        }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Workflows", href: "/workflows" }, { label: category.name }]} />
        <h1 className="text-h2 mt-3 text-ink">{category.name} n8n Workflows</h1>
        <p className="prose-measure mt-3 text-ink-2">{category.intro}</p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {workflows.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-h3 text-center text-ink">{category.name} FAQ</h2>
          <div className="mt-6">
            <Accordion
              items={category.faqs.map((faq, i) => ({ id: `cat-faq-${i}`, question: faq.question, answer: faq.answer }))}
            />
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-3xl text-center">
          <p className="text-sm font-medium text-muted">Related categories</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {related.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}` as const}
                className="rounded-full border border-line/70 px-3.5 py-1.5 text-sm text-ink-2 hover:bg-surface"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
