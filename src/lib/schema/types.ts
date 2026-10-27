export type JsonLdNode = Record<string, unknown>;

// `type` (interface নয়): interface কে Record<string, unknown> এ পাস করা যায় না।
export type JsonLdGraph = {
  '@context': 'https://schema.org';
  '@graph': JsonLdNode[];
};

export const siteBase = (url: string): string => url.replace(/\/$/, '');