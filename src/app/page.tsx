import React from 'react';
import { siteContentRepository } from '@/cms/repositories';
import { HomePageClient } from '@/components/HomePageClient';

export default async function HomePage() {
  const [homepageConfig, brandInfo] = await Promise.all([
    siteContentRepository.getHomepageConfig(),
    siteContentRepository.getBrandInfo(),
  ]);

  return <HomePageClient homepageConfig={homepageConfig} brandInfo={brandInfo} />;
}
