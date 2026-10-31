'use client';

import React, { useEffect, useRef, useState, useCallback, useSyncExternalStore } from 'react';
import { gsap } from 'gsap';

interface GoldenGatewayV3Props {
  isMotionDisabled?: boolean;
}

const STORAGE_KEY = 'philozz_golden_gateway_v3_seen';

function subscribeGateway(callback: () => void) {
  window.addEventListener('popstate', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener('storage', callback);
  };
}

function getInitialGatewayVisibility(): boolean {
  if (typeof window === 'undefined') return true;
  const params = new URLSearchParams(window.location.search);
  const force = params.get('gateway') === 'force';
  const off = params.get('gateway') === 'off' || params.get('gateway') === 'false';
  const motionOff = params.get('motion') === 'off' || params.get('motion') === 'false';
  if (off || motionOff) return false;
  if (force) return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== 'true';
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return true;
}

export function GoldenGatewayV3({ isMotionDisabled = false }: GoldenGatewayV3Props) {
  const isInitialVisible = useSyncExternalStore(
    subscribeGateway,
    getInitialGatewayVisibility,
    getServerSnapshot
  );

  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const isActive = isInitialVisible && !isDismissed && !isMotionDisabled;

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const logoLayerRef = useRef<HTMLDivElement>(null);
  const crossbarLayerRef = useRef<SVGSVGElement>(null);
  const fullLineWidthRef = useRef<HTMLDivElement>(null);
  const topShutterRef = useRef<HTMLDivElement>(null);
  const bottomShutterRef = useRef<HTMLDivElement>(null);
  const topShutterGlowRef = useRef<HTMLDivElement>(null);
  const bottomShutterGlowRef = useRef<HTMLDivElement>(null);
  const glintRef = useRef<HTMLDivElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Complete cleanup function
  const cleanup = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore sessionStorage quota/incognito errors
    }
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('gateway-active');
      document.documentElement.classList.add('gateway-dismissed');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    setIsDismissed(true);
  }, []);

  // Manual Skip handler (Button click or Escape key)
  const handleSkip = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('gateway-active');
      document.documentElement.classList.add('gateway-dismissed');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.15,
        ease: 'power2.out',
        onComplete: cleanup,
      });
    } else {
      cleanup();
    }
  }, [cleanup]);

  // Lock body scroll while gateway is active
  useEffect(() => {
    if (!isActive) return;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Failsafe timer: maximum 6.5s to ensure overlay is NEVER permanently stuck
    const failsafe = setTimeout(() => {
      cleanup();
    }, 6500);

    return () => {
      clearTimeout(failsafe);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isActive, cleanup]);

  // Keyboard navigation: Escape key skips intro
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleSkip]);

  // Main GSAP animation timeline
  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    const logoLayer = logoLayerRef.current;
    const crossbarLayer = crossbarLayerRef.current;
    const fullLine = fullLineWidthRef.current;
    const topShutter = topShutterRef.current;
    const bottomShutter = bottomShutterRef.current;
    const topGlow = topShutterGlowRef.current;
    const bottomGlow = bottomShutterGlowRef.current;
    const glint = glintRef.current;
    const skipButton = skipButtonRef.current;

    if (!container || !stage || !logoLayer || !topShutter || !bottomShutter) return;

    // Calculate responsive base scale for stage
    const getBaseScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleX = vw / 1600;
      const scaleY = vh / 900;
      return vw < 900 ? Math.max(scaleX, 0.45) : Math.max(scaleX, scaleY);
    };

    let currentBaseScale = getBaseScale();

    // Initial states: stage centered with crossbar at exact viewport center (50vw, 50vh)
    gsap.set(stage, {
      scale: currentBaseScale,
      x: 0,
      y: 0,
      transformOrigin: '50% 50%',
    });
    gsap.set(topShutter, { yPercent: 0 });
    gsap.set(bottomShutter, { yPercent: 0 });
    if (topGlow && bottomGlow) gsap.set([topGlow, bottomGlow], { opacity: 0 });
    gsap.set(fullLine, { opacity: 0, scaleX: 0.35 });
    if (glint) gsap.set(glint, { xPercent: -100, opacity: 0 });

    const handleResize = () => {
      currentBaseScale = getBaseScale();
      if (timelineRef.current && timelineRef.current.time() < 2.10) {
        gsap.set(stage, { scale: currentBaseScale });
      }
    };
    window.addEventListener('resize', handleResize);

    // Video playback attempt
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {
        // Handled: browser autoplay restrictions fallback gracefully
      });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        cleanup();
      },
    });
    timelineRef.current = tl;

    // Expose timeline to window for deterministic programmatic verification
    if (typeof window !== 'undefined') {
      (window as unknown as { __GATEWAY_TIMELINE?: gsap.core.Timeline }).__GATEWAY_TIMELINE = tl;
    }

    // ---------------------------------------------------------------
    // Phase 1 (0.00s - 2.10s):
    // PZ Inscription and PHILOZZ lockup play smoothly in video.
    // The crossbar in the video is drawn along Y=450 in native 1600x900 space.
    // At t = 2.10s, vector crossbar activates exactly coincident with the video stroke.
    // ---------------------------------------------------------------
    tl.set(crossbarLayer, { opacity: 1 }, 2.10);

    // ---------------------------------------------------------------
    // Phase 2 (2.10s - 2.49s):
    // Camera zooms directly into the horizontal crossbar center (800, 450)
    // without translation drift, keeping the line anchored at (50vw, 50vh).
    // All non-crossbar pixels (P loop, Z diagonal, dot, text) vanish to 0.
    // ---------------------------------------------------------------
    tl.to(
      stage,
      {
        scale: () => currentBaseScale * 3.34,
        x: 0,
        y: 0,
        duration: 0.39,
        ease: 'power2.inOut',
      },
      2.10
    );

    // Vanish of non-crossbar elements (starts at 2.13s, fully gone by 2.49s)
    tl.to(
      logoLayer,
      {
        opacity: 0,
        duration: 0.36,
        ease: 'power2.inOut',
      },
      2.13
    );

    // Ensure non-crossbar logo elements are completely removed from DOM rendering
    tl.set(logoLayer, { display: 'none' }, 2.49);

    // ---------------------------------------------------------------
    // Phase 3 (2.49s - 3.02s):
    // Isolated razor-thin crossbar seamlessly expands across viewport width.
    // Both crossbarLayer and fullLine share the identical screen Y (50vh) <= 0.0px error.
    // ---------------------------------------------------------------
    tl.set(fullLine, { opacity: 1 }, 2.49);
    tl.to(
      fullLine,
      {
        scaleX: 1.0,
        duration: 0.45,
        ease: 'power2.out',
      },
      2.49
    );
    tl.to(crossbarLayer, { opacity: 0, duration: 0.08 }, 2.49);

    // Glint sheen runs left-to-right along the horizontal crossbar (2.46s - 2.88s)
    if (glint) {
      tl.fromTo(
        glint,
        { xPercent: -60, opacity: 0 },
        {
          xPercent: 160,
          opacity: 0.85,
          duration: 0.48,
          ease: 'power1.inOut',
        },
        2.46
      );
      tl.to(glint, { opacity: 0, duration: 0.1 }, 2.86);
    }

    // Hide stage completely once the full-width stretching line takes over
    tl.set(stage, { display: 'none' }, 3.02);

    // Fade out Skip button as gateway begins opening
    if (skipButton) {
      tl.to(skipButton, { opacity: 0, duration: 0.25 }, 3.02);
    }

    // ---------------------------------------------------------------
    // Phase 4 (3.02s - 4.07s):
    // Split the central seam into opposing gold edges and move shutters
    // toward viewport top and bottom, revealing the live hydrated homepage DOM!
    // ---------------------------------------------------------------
    tl.set([topGlow, bottomGlow], { opacity: 1 }, 3.02);
    tl.to(
      topShutter,
      {
        yPercent: -101,
        duration: 1.05,
        ease: 'power3.inOut',
      },
      3.02
    );

    tl.to(
      bottomShutter,
      {
        yPercent: 101,
        duration: 1.05,
        ease: 'power3.inOut',
      },
      3.02
    );

    // Make container background transparent at 3.02s so homepage shows through parting shutters
    tl.set(container, { backgroundColor: 'transparent' }, 3.02);

    // Fade out the center isolated line as the shutters begin parting
    tl.to(fullLine, { opacity: 0, duration: 0.08 }, 3.03);

    // Golden rim glow fades away as shutters approach viewport edges (p: 0.65 -> 1.0)
    if (topGlow && bottomGlow) {
      tl.to(
        [topGlow, bottomGlow],
        {
          opacity: 0,
          duration: 0.35,
          ease: 'power2.out',
        },
        3.70
      );
    }

    // ---------------------------------------------------------------
    // Phase 5 (4.07s - 4.25s):
    // Final cleanup: fade overlay container completely and release DOM
    // ---------------------------------------------------------------
    tl.to(
      container,
      {
        opacity: 0,
        duration: 0.18,
        ease: 'power1.out',
      },
      4.07
    );

    return () => {
      window.removeEventListener('resize', handleResize);
      if (tl) tl.kill();
    };
  }, [isActive, cleanup]);

  if (!isActive) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="PHILOZZ Gateway Introduction"
      className="golden-gateway-v3-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        pointerEvents: 'auto',
        overflow: 'hidden',
        userSelect: 'none',
        backgroundColor: '#0A0A0D',
      }}
    >
      {/* Skip Button (Top Right) */}
      <button
        ref={skipButtonRef}
        onClick={handleSkip}
        type="button"
        aria-label="Skip intro animation"
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 1000000,
          padding: '0.4rem 0.9rem',
          borderRadius: '9999px',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.75rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#E4C88A',
          backgroundColor: 'rgba(17, 17, 22, 0.85)',
          border: '1px solid rgba(201, 164, 92, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
        }}
      >
        Skip <span style={{ opacity: 0.6, marginLeft: '0.25rem' }}>[ESC]</span>
      </button>

      {/* Layer 4: The Split Obsidian Shutters (Phase 4) */}
      {/* Top Shutter: covers 0 to 50vh, solid #0A0A0D, moves upward (-101%) */}
      <div
        ref={topShutterRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          backgroundColor: '#0A0A0D',
          zIndex: 20,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      >
        {/* Lower gold lip of top shutter */}
        <div
          ref={topShutterGlowRef}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1.5px',
            background:
              'linear-gradient(90deg, rgba(201,164,92,0.15) 0%, rgba(255,247,230,1) 50%, rgba(201,164,92,0.15) 100%)',
            boxShadow:
              '0 1px 6px rgba(228, 200, 138, 0.75), 0 2px 18px rgba(201, 164, 92, 0.45)',
          }}
        />
      </div>

      {/* Bottom Shutter: covers 50vh to 100vh, solid #0A0A0D, moves downward (+101%) */}
      <div
        ref={bottomShutterRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          backgroundColor: '#0A0A0D',
          zIndex: 20,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      >
        {/* Upper gold lip of bottom shutter */}
        <div
          ref={bottomShutterGlowRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1.5px',
            background:
              'linear-gradient(90deg, rgba(201,164,92,0.15) 0%, rgba(255,247,230,1) 50%, rgba(201,164,92,0.15) 100%)',
            boxShadow:
              '0 -1px 6px rgba(228, 200, 138, 0.75), 0 -2px 18px rgba(201, 164, 92, 0.45)',
          }}
        />
      </div>

      {/* Layer 1 & 2: STAGE CONTAINER (In front of shutters, zIndex: 30) */}
      <div
        ref={stageRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '1600px',
          height: '900px',
          marginLeft: '-800px',
          marginTop: '-450px',
          zIndex: 30,
          pointerEvents: 'none',
          transformOrigin: '50% 50%',
          transform: 'translate(0px, 0px)',
        }}
      >
        {/* Layer 1: Base Logo Animation (Video) */}
        <div
          ref={logoLayerRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            preload="auto"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          >
            <source src="/philozz-intro-stroke.webm" type="video/webm" />
            <source src="/philozz-intro-stroke.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Layer 2: Independent Vector Crossbar */}
        <svg
          ref={crossbarLayerRef}
          viewBox="0 0 1600 900"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: 0,
          }}
        >
          <defs>
            <linearGradient id="gatewayCrossbarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C9A45C" stopOpacity="0" />
              <stop offset="12%" stopColor="#C9A45C" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#FFF7E6" stopOpacity="1" />
              <stop offset="88%" stopColor="#E4C88A" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#C9A45C" stopOpacity="0" />
            </linearGradient>

            <filter id="goldBeamGlow" x="-20%" y="-100%" width="140%" height="300%">
              <feGaussianBlur stdDeviation="3.2" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer luminous glow stroke precisely calibrated to real logo crossbar at Y=450 */}
          <path
            d="M 480 450 L 1120 450"
            fill="none"
            stroke="url(#gatewayCrossbarGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#goldBeamGlow)"
            opacity="0.85"
          />

          {/* Core razor-thin crossbar line precisely calibrated to real logo crossbar at Y=450 */}
          <path
            d="M 480 450 L 1120 450"
            fill="none"
            stroke="#FFFDF8"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Layer 3: Full-width stretching horizontal line & Glint (Phase 3, zIndex: 35) */}
      <div
        ref={fullLineWidthRef}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: '2px',
          marginTop: '-1px',
          zIndex: 35,
          pointerEvents: 'none',
          opacity: 0,
          transformOrigin: 'center center',
          background:
            'linear-gradient(90deg, rgba(201,164,92,0) 0%, rgba(201,164,92,0.85) 12%, rgba(255,247,230,1) 50%, rgba(228,200,138,0.85) 88%, rgba(201,164,92,0) 100%)',
          boxShadow: '0 0 10px rgba(228, 200, 138, 0.65), 0 0 24px rgba(201, 164, 92, 0.35)',
        }}
      >
        {/* Dynamic glint moving across the line */}
        <div
          ref={glintRef}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '12rem',
            height: '2rem',
            marginTop: '-1rem',
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(255,245,215,0.7) 40%, rgba(201,164,92,0) 80%)',
            filter: 'blur(2px)',
          }}
        />
      </div>
    </div>
  );
}
