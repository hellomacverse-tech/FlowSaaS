import { siteBase, type JsonLdGraph, type JsonLdNode } from './types';

export interface HubSchemaInput {
  slug: string;
  name: string;
  description: string | null;
  indexablePairs: { slug: string; label: string }[];
}

/** App hub: WebPage + ItemList of indexable pairs + SoftwareApplication mention (no offers, no ratings). */
export function buildHubGraph(i: HubSchemaInput, siteUrl: string): JsonLdGraph {
  const site = siteBase(siteUrl);
  const url = `${site}/integrations/${i.slug}`;
  const graph: JsonLdNode[] = [
    {
      '@type': 'WebPage', '@id': `${url}#webpage`, url, name: `${i.name} Automation with n8n`,
      isPartOf: { '@id': `${site}/#website` }, breadcrumb: { '@id': `${url}#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site },
        { '@type': 'ListItem', position: 2, name: 'Integrations', item: `${site}/integrations` },
        { '@type': 'ListItem', position: 3, name: i.name },
      ],
    },
    {
      '@type': 'SoftwareApplication', '@id': `${url}#software`, name: i.name,
      applicationCategory: 'BusinessApplication',
      ...(i.description ? { description: i.description } : {}),
    },
  ];
  if (i.indexablePairs.length) {
    graph.push({
      '@type': 'ItemList', '@id': `${url}#pairs`,
      itemListElement: i.indexablePairs.map((p, idx) => ({
        '@type': 'ListItem', position: idx + 1, url: `${site}/integrations/${p.slug}`, name: p.label,
      })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
