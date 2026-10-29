import React from 'react';
import type { Metadata } from 'next';
import { siteContentRepository, projectRepository, articleRepository } from '@/cms/repositories';
import { SITE_CONFIG } from '@/lib/seoData';
import { HomePageClient } from '@/components/HomePageClient';

export async function generateMetadata(): Promise<Metadata> {
  const seoConfig = await siteContentRepository.getSeoConfig();
  const hp = seoConfig.homepage;

  const title = hp?.title || seoConfig.siteTitle;
  const description = hp?.description || seoConfig.defaultDescription;
  const ogImage = hp?.ogImageUrl || seoConfig.defaultOgImage || '/images/philozz-cinematic-hero.png';

  return {
    title,
    description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      url: SITE_CONFIG.url,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
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

export default async function HomePage() {
  const [
    homepageConfig,
    brandInfo,
    technologies,
    orbitSlots,
    expertiseAreas,
    publishedProjects,
    publishedArticles,
  ] = await Promise.all([
    siteContentRepository.getHomepageConfig(),
    siteContentRepository.getBrandInfo(),
    siteContentRepository.getTechnologies(),
    siteContentRepository.getOrbitSlots(),
    siteContentRepository.getExpertiseAreas(),
    projectRepository.getAll({ status: 'published' }),
    articleRepository.getAll({ status: 'published' }),
  ]);

  // Featured homepage projects: prefer explicitly marked featured projects sorted by featuredOrder,
  // falling back to first 3 published projects.
  const explicitFeatured = publishedProjects
    .filter((p) => p.featured)
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
  const featuredProjects = explicitFeatured.length === 3 ? explicitFeatured : publishedProjects.slice(0, 3);

  // Featured homepage articles: prefer explicitly marked featured articles,
  // falling back to published articles ordered by displayOrder.
  const explicitFeaturedNotes = publishedArticles.filter((a) => a.featured);
  const featuredArticles = explicitFeaturedNotes.length > 0 ? explicitFeaturedNotes : publishedArticles.slice(0, 4);

  return (
    <HomePageClient
      homepageConfig={homepageConfig}
      brandInfo={brandInfo}
      technologies={technologies}
      orbitSlots={orbitSlots}
      expertiseAreas={expertiseAreas}
      featuredProjects={featuredProjects}
      featuredArticles={featuredArticles}
    />
  );
}

