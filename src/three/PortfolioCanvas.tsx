'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { SceneDirector } from './SceneDirector';

interface PortfolioCanvasProps {
  scrollProgress?: number;
  isWebGLDisabled?: boolean;
  isMotionDisabled?: boolean;
  isMobile?: boolean;
}

export function PortfolioCanvas({
  isWebGLDisabled = false,
  isMotionDisabled = false,
  isMobile = false,
}: PortfolioCanvasProps) {
  const [hasWebGLContextLoss, setHasWebGLContextLoss] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const scrollProgressRef = React.useRef<number>(0);

  // Passive natural scroll tracking without triggering React re-renders
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgressRef.current = totalHeight > 0 ? Math.min(1, Math.max(0, scrollY / totalHeight)) : 0;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Monitor document visibility to suspend frame loop when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Graceful fallback if WebGL is disabled or context is lost
  if (isWebGLDisabled || hasWebGLContextLoss) {
    return null;
  }

  // DPR hard-cap per requirements: max 1.0 mobile, 1.5 desktop
  const dprCap: [number, number] = isMobile ? [1, 1] : [1, 1.5];

  // Suspend frameloop when tab is hidden or when idle in non-3D regions
  const frameLoopMode = isTabVisible ? 'always' : 'never';

  return (
    <div className="canvas-background-fixed" aria-hidden="true">
      <Canvas
        dpr={dprCap}
        frameloop={frameLoopMode}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            setHasWebGLContextLoss(true);
          });
        }}
      >
        <SceneDirector
          scrollProgressRef={scrollProgressRef}
          isMobile={isMobile}
          isMotionDisabled={isMotionDisabled}
        />
      </Canvas>
    </div>
  );
}
