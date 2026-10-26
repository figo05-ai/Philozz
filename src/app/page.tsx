import React from 'react';
import { siteContentRepository } from '@/cms/repositories';
import { HomePageClient } from '@/components/HomePageClient';

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

