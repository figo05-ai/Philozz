'use client';

import React, { useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { Navigation } from '@/components/Navigation';
import { HeroScene } from '@/scenes/HeroScene';
import { ArchitectureScene } from '@/scenes/ArchitectureScene';
import { ProjectsScene } from '@/scenes/ProjectsScene';
import { NotesScene } from '@/scenes/NotesScene';
import { FinaleScene } from '@/scenes/FinaleScene';
import { FallbackView } from '@/components/FallbackView';
import { useTestOverrides } from '@/lib/useTestOverrides';
import { HomepageConfigEntity, BrandInfoEntity } from '@/cms/models/site';

import {
  TechnologyEntity,
  OrbitSlotsTuple,
  ExpertiseAreaEntity,
} from '@/cms/models/technology';

// Dynamically import Three.js Canvas to split WebGL from initial critical bundle
const PortfolioCanvas = dynamic(
  () => import('@/three/PortfolioCanvas').then((mod) => mod.PortfolioCanvas),
  { ssr: false }
);

export interface HomePageClientProps {
  homepageConfig?: HomepageConfigEntity;
  brandInfo?: BrandInfoEntity;
  technologies?: TechnologyEntity[];
  orbitSlots?: OrbitSlotsTuple;
  expertiseAreas?: ExpertiseAreaEntity[];
}

export function HomePageClient({
  homepageConfig,
  brandInfo,
  technologies,
  orbitSlots,
  expertiseAreas,
}: HomePageClientProps = {}) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const { isWebGLDisabled, isMotionDisabled, isMobile } = useTestOverrides();

  return (
    <>
      {/* 3D Luxury Background Cosmos */}
      {isMounted && (
        <PortfolioCanvas
          isWebGLDisabled={isWebGLDisabled}
          isMotionDisabled={isMotionDisabled}
          isMobile={isMobile}
        />
      )}

      {/* Navigation Header */}
      <Navigation brand={brandInfo} />

      {/* Main Luxury Content Stream */}
      <main id="main-content" className="content-layer-scroll">
        <HeroScene
          config={homepageConfig?.hero}
          brand={brandInfo}
          aboutConfig={homepageConfig?.about}
        />
        <ArchitectureScene
          technologies={technologies}
          orbitSlots={orbitSlots}
          expertiseAreas={expertiseAreas}
        />
        <ProjectsScene />
        <NotesScene />
      </main>

      {/* Top-Level Contentinfo Landmark Footer */}
      <FinaleScene config={homepageConfig?.contact} brand={brandInfo} />

      {/* Fallback & Accessibility Status */}
      <FallbackView isWebGLDisabled={isWebGLDisabled} />
    </>
  );
}
