import { Metadata } from 'next';

interface MetadataProps {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  path?: string;
}

export function constructMetadata({
  title = 'FlowSaaS - Production-Ready n8n Workflows & Micro-SaaS',
  description = 'Automate your business infrastructure with production-ready n8n workflows, templates, and browser-run Micro-SaaS tools.',
  image = '/og-image.png',
  noIndex = false,
  path = '',
}: MetadataProps = {}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flowsaas.vercel.app';
  const url = `${baseUrl}${path}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'FlowSaaS',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

// Aliasing to fix the import error across pages
export const buildPageMetadata = constructMetadata;