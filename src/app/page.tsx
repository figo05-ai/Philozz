'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { Navigation } from '@/components/Navigation';
import { HeroScene } from '@/scenes/HeroScene';
import { ArchitectureScene } from '@/scenes/ArchitectureScene';
import { ProjectsScene } from '@/scenes/ProjectsScene';
import { NotesScene } from '@/scenes/NotesScene';
import { FinaleScene } from '@/scenes/FinaleScene';
import { FallbackView } from '@/components/FallbackView';
import { useTestOverrides } from '@/lib/useTestOverrides';
import { PortfolioCanvas } from '@/three/PortfolioCanvas';

export default function HomePage() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [scrollProgress, setScrollProgress] = useState(0);
  const { isWebGLDisabled, isMotionDisabled, isMobile } = useTestOverrides();

  // Passive natural scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? Math.min(1, Math.max(0, scrollY / totalHeight)) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* 3D Luxury Background Cosmos */}
      {isMounted && (
        <PortfolioCanvas
          scrollProgress={scrollProgress}
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
