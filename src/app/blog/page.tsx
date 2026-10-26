import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { BlogArchiveView } from '@/components/BlogArchiveView';
import { getBreadcrumbJsonLd, SITE_CONFIG } from '@/lib/seoData';

export const metadata: Metadata = {
  title: 'Engineering Journal & Technical Notes',
  description:
    'Engineering notes, architectural postmortems, database query optimizations, and backend best practices written by Felopater Nabil (PHILOZZ).',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: `${SITE_CONFIG.url}/blog`,
    siteName: SITE_CONFIG.name,
    title: `Engineering Journal & Technical Notes // ${SITE_CONFIG.name}`,
    description:
      'Engineering notes, architectural postmortems, database query optimizations, and backend best practices.',
    images: [
      {
        url: '/images/philozz-cinematic-hero.png',
        width: 1200,
        height: 630,
        alt: `Engineering Journal // ${SITE_CONFIG.name}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Engineering Journal & Technical Notes // ${SITE_CONFIG.name}`,
    description:
      'Engineering notes, architectural postmortems, database query optimizations, and backend best practices.',
    images: ['/images/philozz-cinematic-hero.png'],
  },
};

function BlogArchiveLoadingFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-obsidian)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-gold-light)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.9rem',
        letterSpacing: '0.08em',
      }}
    >
      LOADING_JOURNAL // PHILOZZ...
    </div>
  );
}

export default function BlogArchivePage() {
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Engineering Journal', url: '/blog' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={<BlogArchiveLoadingFallback />}>
        <BlogArchiveView />
      </Suspense>
    </>
  );
}
