import { siteBase, type JsonLdGraph, type JsonLdNode } from './types';

export interface ServicePackage {
  name: string;
  description: string;
  /** "from" price in whole currency units. Omit for custom-priced packages: no price is emitted for those. */
  fromPrice?: number;
}
export interface ServiceInput {
  path: string;
  name: string;
  serviceType: string;
  description: string;
  currency: string;
  packages: ServicePackage[];
  faq: { question: string; answer: string }[];
}

export function buildServiceGraph(s: ServiceInput, siteUrl: string): JsonLdGraph {
  const site = siteBase(siteUrl);
  const url = `${site}${s.path}`;
  const graph: JsonLdNode[] = [
    {
      '@type': 'Service', '@id': `${url}#service`, name: s.name, serviceType: s.serviceType,
      description: s.description, provider: { '@id': `${site}/#organization` }, areaServed: 'Worldwide',
      hasOfferCatalog: {
        '@type': 'OfferCatalog', name: `${s.name} packages`,
        itemListElement: s.packages.map((p) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: p.name, description: p.description },
          ...(p.fromPrice !== undefined
            ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: p.fromPrice, priceCurrency: s.currency } }
            : {}),
        })),
      },
    },
    {
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site },
        { '@type': 'ListItem', position: 2, name: s.name },
      ],
    },
  ];
  if (s.faq.length) {
    graph.push({
      '@type': 'FAQPage', '@id': `${url}#faq`,
      mainEntity: s.faq.map((f) => ({
        '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
