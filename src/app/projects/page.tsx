import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { ProjectsArchiveView } from '@/components/ProjectsArchiveView';
import { getBreadcrumbJsonLd, SITE_CONFIG } from '@/lib/seoData';

import { siteContentRepository, projectRepository } from '@/cms/repositories';

export async function generateMetadata(): Promise<Metadata> {
  const seoConfig = await siteContentRepository.getSeoConfig();
  const proj = seoConfig.projectsArchive;

  const title = proj?.title || 'Selected Engineering Projects';
  const description =
    proj?.description ||
    'A collection of verified production software systems, backend architectures, high-concurrency queue platforms, and database designs engineered by Felopater Nabil (PHILOZZ).';
  const ogImage = proj?.ogImageUrl || seoConfig.defaultOgImage || '/images/philozz-cinematic-hero.png';

  return {
    title,
    description,
    alternates: {
      canonical: '/projects',
    },
    openGraph: {
      type: 'website',
      locale: seoConfig.locale || SITE_CONFIG.locale,
      url: `${SITE_CONFIG.url}/projects`,
      siteName: SITE_CONFIG.name,
      title: `${title} // ${SITE_CONFIG.name}`,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} // ${SITE_CONFIG.name}`,
        },
      ],
    },
    twitter: {
      card: seoConfig.twitterCard || 'summary_large_image',
      title: `${title} // ${SITE_CONFIG.name}`,
      description,
      images: [ogImage],
    },
  };
}

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

export default async function ProjectsPage() {
  const publishedProjects = await projectRepository.getAll({ status: 'published' });

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
        <ProjectsArchiveView initialProjects={publishedProjects} />
      </Suspense>
    </>
  );
}
