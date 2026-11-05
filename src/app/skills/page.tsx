import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { EngineeringAtlasView } from '@/components/EngineeringAtlasView';
import { siteContentRepository, projectRepository, articleRepository } from '@/cms/repositories';
import { SITE_CONFIG, getBreadcrumbJsonLd } from '@/lib/seoData';
import { NOTES } from '@/data/portfolioData';
import { NoteItem } from '@/types';
import { ArticleEntity } from '@/cms/models/article';

export async function generateMetadata(): Promise<Metadata> {
  const seoConfig = await siteContentRepository.getSeoConfig();
  const brand = await siteContentRepository.getBrandInfo();

  const title = `Engineering Atlas // ${brand?.name || 'PHILOZZ'} — Knowledge Architecture`;
  const description =
    'A living map of the technologies I use, the systems I build, and the knowledge I continue to explore. Curated technical capabilities, disciplines, and architectural topologies.';
  const ogImage = seoConfig.defaultOgImage || '/images/philozz-cinematic-hero.png';

  return {
    title,
    description,
    alternates: {
      canonical: '/skills',
    },
    openGraph: {
      type: 'website',
      locale: seoConfig.locale || SITE_CONFIG.locale,
      url: `${SITE_CONFIG.url}/skills`,
      siteName: SITE_CONFIG.name,
      title,
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
      title,
      description,
      images: [ogImage],
    },
  };
}

function AtlasLoadingFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-obsidian)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-gold-light)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.875rem',
      }}
    >
      INITIALIZING ENGINEERING ATLAS...
    </div>
  );
}

export default async function SkillsAtlasPage() {
  // Fetch authoritative CMS data strictly in parallel
  const [technologies, disciplines, publishedProjects, brand] = await Promise.all([
    siteContentRepository.getTechnologies(),
    siteContentRepository.getExpertiseAreas(),
    projectRepository.getAll({ status: 'published' }),
    siteContentRepository.getBrandInfo(),
  ]);

  // Published articles / notes for connected learning
  let articles: NoteItem[] = [];
  try {
    const publishedArticles = await articleRepository.getAll({ status: 'published' });
    articles = publishedArticles.map((a: ArticleEntity) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      archiveCategory: a.archiveCategory || 'backend',
      readTime: a.readTime || '5 min read',
      date: a.date || 'Apr 2026',
      featured: a.featured,
      tags: a.tags || [],
      abstract: a.abstract || '',
      sections: a.sections || [],
    }));
  } catch {
    articles = NOTES;
  }

  // Ensure fallback to portfolioData NOTES if none in repository
  const combinedNotes = articles.length > 0 ? articles : NOTES;

  // JSON-LD structured data for indexability
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Engineering Atlas', url: `${SITE_CONFIG.url}/skills` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Suspense fallback={<AtlasLoadingFallback />}>
        <EngineeringAtlasView
          technologies={technologies}
          disciplines={disciplines}
          projects={publishedProjects}
          notes={combinedNotes}
          brandName={brand?.name || 'PHILOZZ'}
          developerName={brand?.developerName || 'Felopater Nabil'}
        />
      </Suspense>
    </>
  );
}
