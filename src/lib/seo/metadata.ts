import { Metadata } from 'next';

interface MetadataProps {
  title?: string | { absolute: string; template?: string } | undefined;
  description?: string | undefined;
  image?: string | undefined;
  noIndex?: boolean | undefined;
  path?: string | undefined;
  robots?: {
    index?: boolean;
    follow?: boolean;
    googleBot?: {
      index?: boolean;
      follow?: boolean;
      noimageindex?: boolean;
    };
  } | undefined;
}

export function constructMetadata({
  title = 'FlowSaaS - Production-Ready n8n Workflows & Micro-SaaS',
  description = 'Automate your business infrastructure with production-ready n8n workflows, templates, and browser-run Micro-SaaS tools.',
  image = '/og-image.png',
  noIndex = false,
  path = '',
  robots,
}: MetadataProps = {}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flowsaas.vercel.app';
  const url = `${baseUrl}${path}`;

  return {
    title,
    description,
    openGraph: {
      title: typeof title === 'string' ? title : title.absolute,
      description,
      url,
      siteName: 'FlowSaaS',
      images: [{ url: image, width: 1200, height: 630, alt: typeof title === 'string' ? title : title.absolute }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: typeof title === 'string' ? title : title.absolute,
      description,
      images: [image],
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
    ...(robots && { robots }),
  };
}

// Aliasing to fix the import error across pages
export const buildPageMetadata = constructMetadata;