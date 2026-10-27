export type JsonLdNode = Record<string, unknown>;
export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': JsonLdNode[];
}
export const siteBase = (url: string): string => url.replace(/\/$/, '');
