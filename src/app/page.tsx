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

// Dynamically import Three.js Canvas to split WebGL from initial critical bundle
const PortfolioCanvas = dynamic(
  () => import('@/three/PortfolioCanvas').then((mod) => mod.PortfolioCanvas),
  { ssr: false }
);

export default function HomePage() {
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
      <Navigation />

      {/* Main Luxury Content Stream */}
      <main id="main-content" className="content-layer-scroll">
        <HeroScene />
        <ArchitectureScene />
        <ProjectsScene />
        <NotesScene />
        <FinaleScene />
      </main>

      {/* Fallback & Accessibility Status */}
      <FallbackView isWebGLDisabled={isWebGLDisabled} />
    </>
  );
}
