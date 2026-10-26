import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { ProjectsArchiveView } from '@/components/ProjectsArchiveView';
import { getBreadcrumbJsonLd, SITE_CONFIG } from '@/lib/seoData';

export const metadata: Metadata = {
  title: 'Selected Engineering Projects',
  description:
    'A collection of verified production software systems, backend architectures, high-concurrency queue platforms, and database designs engineered by Felopater Nabil (PHILOZZ).',
  alternates: {
    canonical: '/projects',
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: `${SITE_CONFIG.url}/projects`,
    siteName: SITE_CONFIG.name,
    title: `Selected Engineering Projects // ${SITE_CONFIG.name}`,
    description:
      'Verified production software systems, backend architectures, high-concurrency queue platforms, and database designs.',
    images: [
      {
        url: '/images/philozz-cinematic-hero.png',
        width: 1200,
        height: 630,
        alt: `Selected Engineering Projects // ${SITE_CONFIG.name}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Selected Engineering Projects // ${SITE_CONFIG.name}`,
    description:
      'Verified production software systems, backend architectures, high-concurrency queue platforms, and database designs.',
    images: ['/images/philozz-cinematic-hero.png'],
  },
};

function ArchiveLoadingFallback() {
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
      LOADING_ARCHIVE // PHILOZZ...
    </div>
  );
}

export default function ProjectsPage() {
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Projects', url: '/projects' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={<ArchiveLoadingFallback />}>
        <ProjectsArchiveView />
      </Suspense>
    </>
  );
}
