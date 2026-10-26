import React from 'react';
import type { Metadata } from 'next';
import { siteContentRepository } from '@/cms/repositories';
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
  const [homepageConfig, brandInfo, technologies, orbitSlots, expertiseAreas] = await Promise.all([
    siteContentRepository.getHomepageConfig(),
    siteContentRepository.getBrandInfo(),
    siteContentRepository.getTechnologies(),
    siteContentRepository.getOrbitSlots(),
    siteContentRepository.getExpertiseAreas(),
  ]);

  return (
    <HomePageClient
      homepageConfig={homepageConfig}
      brandInfo={brandInfo}
      technologies={technologies}
      orbitSlots={orbitSlots}
      expertiseAreas={expertiseAreas}
    />
  );
}

