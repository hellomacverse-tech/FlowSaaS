import { siteBase, type JsonLdGraph, type JsonLdNode } from './types';

export interface CollectionInput {
  path: string; // e.g. /workflows or /categories/e-commerce
  name: string;
  description: string;
  items: { url: string; name: string }[]; // absolute or site-relative; top 12 are used
  faq?: { question: string; answer: string }[]; // only for pages that show the same FAQ visibly
}

export function buildCollectionGraph(c: CollectionInput, siteUrl: string): JsonLdGraph {
  const site = siteBase(siteUrl);
  const url = `${site}${c.path}`;
  const abs = (u: string): string => (u.startsWith('http') ? u : `${site}${u}`);
  const graph: JsonLdNode[] = [
    {
      '@type': 'CollectionPage', '@id': `${url}#webpage`, url, name: c.name, description: c.description,
      isPartOf: { '@id': `${site}/#website` },
    },
    {
      '@type': 'ItemList', '@id': `${url}#list`,
      itemListElement: c.items.slice(0, 12).map((it, i) => ({
        '@type': 'ListItem', position: i + 1, url: abs(it.url), name: it.name,
      })),
    },
  ];
  if (c.faq && c.faq.length) {
    graph.push({
      '@type': 'FAQPage', '@id': `${url}#faq`,
      mainEntity: c.faq.map((f) => ({
        '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
