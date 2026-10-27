import type { PairViewModel } from '@/lib/pseo/view-model';
import { siteBase, type JsonLdGraph, type JsonLdNode } from './types';

export type { JsonLdGraph, JsonLdNode } from './types';

export function buildPairGraph(vm: PairViewModel, siteUrl: string): JsonLdGraph {
  const site = siteBase(siteUrl);
  const url = `${site}/integrations/${vm.pair.slug}`;
  const title = `${vm.a.name} to ${vm.b.name}`;
  const graph: JsonLdNode[] = [
    {
      '@type': 'WebPage', '@id': `${url}#webpage`, url, name: `Connect ${title} with n8n`,
      description: vm.pair.intro_md ?? undefined,
      isPartOf: { '@id': `${site}/#website` }, breadcrumb: { '@id': `${url}#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site },
        { '@type': 'ListItem', position: 2, name: 'Integrations', item: `${site}/integrations` },
        { '@type': 'ListItem', position: 3, name: title },
      ],
    },
  ];
  if (vm.pair.steps.length) {
    graph.push({
      '@type': 'HowTo', '@id': `${url}#howto`, name: `How to connect ${title} with n8n`,
      tool: [{ '@type': 'HowToTool', name: 'n8n' }],
      step: vm.pair.steps.map((s, i) => ({
        '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text, url: `${url}#step-${i + 1}`,
      })),
    });
  }
  if (vm.pair.faq.length) {
    graph.push({
      '@type': 'FAQPage', '@id': `${url}#faq`,
      mainEntity: vm.pair.faq.map((f) => ({
        '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }
  if (vm.workflows.length) {
    graph.push({
      '@type': 'ItemList', '@id': `${url}#workflows`,
      itemListElement: vm.workflows.map((w, i) => ({
        '@type': 'ListItem', position: i + 1, url: `${site}/workflows/${w.slug}`, name: w.title,
      })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
