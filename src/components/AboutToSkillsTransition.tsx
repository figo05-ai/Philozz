'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function AboutToSkillsTransition() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const glowPathRef = useRef<SVGPathElement>(null);
  const pulseGroupRef = useRef<SVGGElement>(null);
  const pulseCoreRef = useRef<SVGCircleElement>(null);
  const pulseHaloRef = useRef<SVGCircleElement>(null);
  const emitterNodeRef = useRef<SVGGElement>(null);
  const destNodeRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) return;

    const skillsSection = document.getElementById('skills');
    if (!skillsSection) return;

    let pathLength = 0;
    let isMobile = window.innerWidth <= 960;

    // Helper to calculate smooth curved path connecting BUILDING code box to Skills orbit
    const computeCoordinatesAndPath = (progress: number) => {
      // Line must completely disappear once Skills section reaches resting state (P >= 0.78)
      // and must remain hidden while in About resting state (P <= 0.06)
      if (progress <= 0.06 || progress >= 0.78) {
        if (containerRef.current) {
          containerRef.current.style.opacity = '0';
          containerRef.current.style.display = 'none';
        }
        return;
      }

      const ideBox = document.querySelector<HTMLElement>('.comp-ide-box');
      const buildingCard =
        document.querySelector<HTMLElement>('.comp-card-building .comp-building-canvas') ||
        document.querySelector<HTMLElement>('.comp-card-building');
      const orbitBadge =
        document.querySelector<HTMLElement>('.orbit-center-badge') ||
        document.querySelector<HTMLElement>('.tech-orbit-stage') ||
        document.querySelector<HTMLElement>('.tech-col-center');

      if (!buildingCard || !pathRef.current) return;

      isMobile = window.innerWidth <= 960;

      let startX: number;
      let startY: number;
      let endX: number;
      let endY: number;
      let pathD: string;

      if (!isMobile) {
        // Desktop: Originates precisely from right edge of the illuminated IDE code box
        if (ideBox) {
          const ideRect = ideBox.getBoundingClientRect();
          startX = Math.round(ideRect.right);
          startY = Math.round(ideRect.top + ideRect.height * 0.52);
        } else {
          const bRect = buildingCard.getBoundingClientRect();
          startX = Math.round(bRect.right - 10);
          startY = Math.round(bRect.top + bRect.height * 0.58);
        }

        // Target: Center of Skills technology orbit
        if (orbitBadge) {
          const oRect = orbitBadge.getBoundingClientRect();
          endX = Math.round(oRect.left + oRect.width / 2);
          endY = Math.round(oRect.top - 8);
        } else {
          endX = Math.round(window.innerWidth * 0.5);
          endY = Math.round(window.innerHeight * 0.65);
        }

        // Refined high-tech S-curve through right negative space into orbit
        const deltaY = endY - startY;
        const cp1X = Math.round(startX + Math.min(130, (window.innerWidth - startX) * 0.75));
        const cp1Y = Math.round(startY + deltaY * 0.35);
        const cp2X = Math.round(endX + 120);
        const cp2Y = Math.round(startY + deltaY * 0.85);

        pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
      } else {
        // Mobile (390px/360px): Restrained short vertical trace, zero horizontal overflow
        const bRect = buildingCard.getBoundingClientRect();
        startX = Math.round(bRect.left + bRect.width / 2);
        startY = Math.round(bRect.bottom - 4);
        endX = startX;
        endY = Math.round(Math.min(window.innerHeight - 30, startY + 120));

        const cpY1 = Math.round(startY + 30);
        const cpY2 = Math.round(endY - 30);
        pathD = `M ${startX} ${startY} C ${startX} ${cpY1}, ${endX} ${cpY2}, ${endX} ${endY}`;
      }

      pathRef.current.setAttribute('d', pathD);
      if (glowPathRef.current) {
        glowPathRef.current.setAttribute('d', pathD);
      }

      // Update total path length
      try {
        pathLength = pathRef.current.getTotalLength();
        pathRef.current.style.strokeDasharray = `${pathLength} ${pathLength}`;
        if (glowPathRef.current) {
          glowPathRef.current.style.strokeDasharray = `${pathLength} ${pathLength}`;
        }
      } catch {
        pathLength = 1000;
      }

      // Position emitter node at origin
      if (emitterNodeRef.current) {
        emitterNodeRef.current.setAttribute('transform', `translate(${startX}, ${startY})`);
      }

      // Position destination node at arrival target
      if (destNodeRef.current) {
        destNodeRef.current.setAttribute('transform', `translate(${endX}, ${endY})`);
      }

      // ----------------------------------------------------
      // STAGE 03: DATA FLOW PATH DRAW & MOVING LIGHT PULSE
      // Active from P = 0.18 to P = 0.68
      // ----------------------------------------------------
      const drawStart = 0.18;
      const drawEnd = 0.68;
      let drawRatio = 0;

      if (progress >= drawStart && progress <= drawEnd) {
        drawRatio = (progress - drawStart) / (drawEnd - drawStart);
      } else if (progress > drawEnd) {
        drawRatio = 1;
      }

      const offset = pathLength * (1 - drawRatio);
      pathRef.current.style.strokeDashoffset = `${offset}`;
      if (glowPathRef.current) {
        glowPathRef.current.style.strokeDashoffset = `${offset}`;
      }

      // Position moving light pulse at leading tip of path
      if (pulseGroupRef.current && pathLength > 0) {
        if (progress >= drawStart && progress <= 0.76) {
          try {
            const currentDistance = Math.min(pathLength, Math.max(0, pathLength * drawRatio));
            const pt = pathRef.current.getPointAtLength(currentDistance);
            pulseGroupRef.current.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);

            // Fade pulse in as path starts, fade out as it reaches orbit
            let pulseOpacity = 0;
            if (progress < 0.24) {
              pulseOpacity = (progress - drawStart) / (0.24 - drawStart);
            } else if (progress <= 0.65) {
              pulseOpacity = 1;
            } else {
              pulseOpacity = Math.max(0, 1 - (progress - 0.65) / 0.11);
            }
            pulseGroupRef.current.style.opacity = `${pulseOpacity}`;
          } catch {
            // Fallback gracefully
          }
        } else {
          pulseGroupRef.current.style.opacity = '0';
        }
      }

      // Overall SVG overlay opacity & visibility:
      // Fades in smoothly from 0.08 to 0.20, solid during data flow, dissolves cleanly into orbit from 0.68 to 0.78
      if (containerRef.current) {
        let overlayOpacity = 0;
        if (progress < 0.20) {
          overlayOpacity = (progress - 0.06) / 0.14;
        } else if (progress <= 0.68) {
          overlayOpacity = 1;
        } else {
          overlayOpacity = Math.max(0, 1 - (progress - 0.68) / 0.10);
        }

        containerRef.current.style.opacity = `${overlayOpacity}`;
        containerRef.current.style.display = overlayOpacity > 0 ? 'block' : 'none';
      }

      // Emitter node glow at origin
      if (emitterNodeRef.current) {
        if (progress >= 0.08 && progress < 0.64) {
          let emitOpacity = 0;
          if (progress < 0.22) {
            emitOpacity = (progress - 0.08) / 0.14;
          } else if (progress <= 0.48) {
            emitOpacity = 1;
          } else {
            emitOpacity = Math.max(0, 1 - (progress - 0.48) / 0.16);
          }
          emitterNodeRef.current.style.opacity = `${emitOpacity}`;
        } else {
          emitterNodeRef.current.style.opacity = '0';
        }
      }

      // Destination node glow upon arrival
      if (destNodeRef.current) {
        if (progress >= 0.62 && progress < 0.78) {
          const destOpacity =
            progress < 0.68
              ? (progress - 0.62) / 0.06
              : Math.max(0, 1 - (progress - 0.68) / 0.10);
          destNodeRef.current.style.opacity = `${destOpacity}`;
        } else {
          destNodeRef.current.style.opacity = '0';
        }
      }
    };

    // ----------------------------------------------------
    // COORDINATED GSAP SCROLLTRIGGER TIMELINE
    // ----------------------------------------------------
    const ctx = gsap.context(() => {
      // Elements in About and Skills
      const ideBox = document.querySelector<HTMLElement>('.comp-ide-box');
      const ideCode = document.querySelector<HTMLElement>('.comp-ide-code');
      const aboutRevealLayer = document.querySelector<HTMLElement>('.hero-about-reveal-layer');
      const heroBgWrap = document.querySelector<HTMLElement>('.hero-cinematic-bg-wrap');
      const aboutNarrative = document.querySelector<HTMLElement>('.about-grid > div:first-child');
      const aboutCards = document.querySelector<HTMLElement>('.mosaic-grid');

      const skillsColLeft = document.querySelector<HTMLElement>('.tech-col-left');
      const skillsOrbitSvg = document.querySelector<HTMLElement>('.tech-orbit-svg');
      const skillsCenterBadge = document.querySelector<HTMLElement>('.orbit-center-badge');
      const rearPedestals = gsap.utils.toArray<HTMLElement>('.tech-pedestal-node.node-rear');
      const frontPedestals = gsap.utils.toArray<HTMLElement>('.tech-pedestal-node.node-front');
      const disciplinesRows = gsap.utils.toArray<HTMLElement>('.discipline-compact-row');

      // Set initial states for elements entering during transition
      if (!isMobile) {
        if (skillsColLeft) gsap.set(skillsColLeft, { y: 28, opacity: 0 });
        if (skillsOrbitSvg) gsap.set(skillsOrbitSvg, { scale: 0.94, opacity: 0.35 });
        if (skillsCenterBadge) gsap.set(skillsCenterBadge, { scale: 0.88, opacity: 0 });
        if (rearPedestals.length > 0) gsap.set(rearPedestals, { y: 22, opacity: 0 });
        if (frontPedestals.length > 0) gsap.set(frontPedestals, { y: 26, opacity: 0 });
        if (disciplinesRows.length > 0) gsap.set(disciplinesRows, { x: 20, opacity: 0 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'about-to-skills',
          trigger: skillsSection,
          start: 'top bottom',
          end: 'top top',
          scrub: 0.5,
          onUpdate: (self) => {
            const p = self.progress;
            computeCoordinatesAndPath(p);

            // Handle pointer-events handoff
            if (aboutRevealLayer) {
              aboutRevealLayer.style.pointerEvents = p < 0.65 ? 'auto' : 'none';
            }
          },
          onEnter: () => {
            const p = tl.scrollTrigger ? tl.scrollTrigger.progress : 0;
            computeCoordinatesAndPath(p);
          },
          onEnterBack: () => {
            const p = tl.scrollTrigger ? tl.scrollTrigger.progress : 1;
            computeCoordinatesAndPath(p);
          },
          onLeave: () => {
            // Stage 06 (100%): Skills Resting — clear inline overrides so normal interaction works
            if (skillsColLeft) gsap.set(skillsColLeft, { clearProps: 'transform,opacity' });
            if (skillsOrbitSvg) gsap.set(skillsOrbitSvg, { clearProps: 'transform,opacity' });
            if (skillsCenterBadge) gsap.set(skillsCenterBadge, { clearProps: 'transform,opacity' });
            if (rearPedestals.length > 0) gsap.set(rearPedestals, { clearProps: 'opacity' });
            if (frontPedestals.length > 0) gsap.set(frontPedestals, { clearProps: 'opacity' });
            if (disciplinesRows.length > 0) gsap.set(disciplinesRows, { clearProps: 'transform,opacity' });
            if (containerRef.current) {
              containerRef.current.style.display = 'none';
              containerRef.current.style.opacity = '0';
            }
          },
          onLeaveBack: () => {
            // Reversing back to 0%: About Resting — restore pristine settled About state
            if (ideBox) ideBox.classList.remove('building-code-activated');
            if (ideCode) ideCode.classList.remove('building-line-highlight');
            if (heroBgWrap) gsap.set(heroBgWrap, { opacity: 1 });
            if (aboutNarrative) gsap.set(aboutNarrative, { opacity: 1, y: 0 });
            if (aboutCards) gsap.set(aboutCards, { opacity: 1, scale: 1, y: 0 });
            if (aboutRevealLayer) {
              gsap.set(aboutRevealLayer, {
                opacity: 1,
                scale: 1,
                y: 0,
                clearProps: 'filter,maskImage,webkitMaskImage',
              });
              aboutRevealLayer.style.pointerEvents = 'auto';
            }
            if (containerRef.current) {
              containerRef.current.style.display = 'none';
              containerRef.current.style.opacity = '0';
            }
          },
        },
      });

      // Initial evaluation to guarantee correct visibility on mount / reload
      computeCoordinatesAndPath(tl.scrollTrigger ? tl.scrollTrigger.progress : 0);

      // Hide Hero photograph during About->Skills transition so it NEVER leaks behind receding About
      if (heroBgWrap) {
        tl.to(
          heroBgWrap,
          {
            opacity: 0,
            duration: 0.12,
            ease: 'power1.out',
          },
          0
        );
      }

      // ----------------------------------------------------
      // STAGE 02 — CODE ACTIVATION (P: 0.08 - 0.28)
      // ----------------------------------------------------
      tl.to(
        {},
        {
          duration: 0.20,
          onUpdate: () => {
            const p = tl.scrollTrigger ? tl.scrollTrigger.progress : 0;
            if (p >= 0.08 && p <= 0.72) {
              if (ideBox) ideBox.classList.add('building-code-activated');
              if (ideCode) ideCode.classList.add('building-line-highlight');
            } else {
              if (ideBox) ideBox.classList.remove('building-code-activated');
              if (ideCode) ideCode.classList.remove('building-line-highlight');
            }
          },
        },
        0.08
      );

      // Prevent navbar title collision: gently dissolve left narrative text before it reaches navbar
      if (aboutNarrative && !isMobile) {
        tl.to(
          aboutNarrative,
          {
            opacity: 0,
            y: -18,
            ease: 'power2.in',
            duration: 0.28,
          },
          0.16
        );
      }

      // ----------------------------------------------------
      // STAGE 04 — DEPTH TRANSITION (P: 0.25 - 0.72)
      // About cards recede with subtle camera-like depth & restrained parallax
      // ----------------------------------------------------
      if (aboutRevealLayer && !isMobile) {
        // Counter-parallax offset so BUILDING card stays prominently visible
        tl.to(
          aboutRevealLayer,
          {
            y: 90,
            ease: 'power1.out',
            duration: 0.32,
          },
          0.18
        );

        // Gentle scale recession anchored toward the BUILDING card
        tl.to(
          aboutRevealLayer,
          {
            scale: 0.94,
            transformOrigin: '75% 38%',
            ease: 'power2.inOut',
            duration: 0.34,
          },
          0.30
        );

        // Soft fade out as Skills section arrives
        tl.to(
          aboutRevealLayer,
          {
            opacity: 0,
            ease: 'power2.in',
            duration: 0.22,
          },
          0.50
        );
      }

      // ----------------------------------------------------
      // STAGE 05 — SKILLS REVEAL (P: 0.55 - 0.92)
      // Coordinated staggered entrance of technology ecosystem
      // ----------------------------------------------------
      if (!isMobile) {
        // Left Column Editorial ("Tools for Bigger Ideas")
        if (skillsColLeft) {
          tl.to(
            skillsColLeft,
            {
              y: 0,
              opacity: 1,
              ease: 'power2.out',
              duration: 0.28,
            },
            0.52
          );
        }

        // Golden Orbital Rings & Center Badge
        if (skillsOrbitSvg) {
          tl.to(
            skillsOrbitSvg,
            {
              scale: 1.0,
              opacity: 1,
              ease: 'power2.out',
              duration: 0.26,
            },
            0.56
          );
        }

        if (skillsCenterBadge) {
          tl.to(
            skillsCenterBadge,
            {
              scale: 1.0,
              opacity: 1,
              ease: 'power2.out',
              duration: 0.24,
            },
            0.58
          );
        }

        // 9 Technology Pedestals: Rear Row (Laravel, PHP, MySQL, JavaScript)
        if (rearPedestals.length > 0) {
          tl.to(
            rearPedestals,
            {
              y: 0,
              opacity: 1,
              stagger: 0.04,
              ease: 'power2.out',
              duration: 0.26,
            },
            0.60
          );
        }

        // Front Row (React, Next.js, Redis, Docker, Linux)
        if (frontPedestals.length > 0) {
          tl.to(
            frontPedestals,
            {
              y: 0,
              opacity: 1,
              stagger: 0.04,
              ease: 'power2.out',
              duration: 0.26,
            },
            0.66
          );
        }

        // Right Column Disciplines List
        if (disciplinesRows.length > 0) {
          tl.to(
            disciplinesRows,
            {
              x: 0,
              opacity: 1,
              stagger: 0.03,
              ease: 'power2.out',
              duration: 0.24,
            },
            0.68
          );
        }
      } else {
        // Mobile simple entry
        if (skillsColLeft) {
          tl.to(skillsColLeft, { opacity: 1, ease: 'power1.out', duration: 0.3 }, 0.4);
        }
      }
    });

    // Window resize handler to maintain path precision
    const handleResize = () => {
      computeCoordinatesAndPath(ScrollTrigger.getById('about-to-skills')?.progress || 0);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      ctx.revert();
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      ref={containerRef}
      className="about-skills-circuit-overlay"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 35,
        overflow: 'hidden',
        opacity: 0,
        display: 'none',
        transition: 'opacity 0.2s ease',
      }}
    >
      <svg
        className="about-skills-svg"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          overflow: 'visible',
        }}
      >
        <defs>
          {/* Metallic Gold Circuit Gradient */}
          <linearGradient id="goldTraceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2D1" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#E5C07B" stopOpacity="0.9" />
            <stop offset="65%" stopColor="#C9A45C" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#9E7A36" stopOpacity="0.75" />
          </linearGradient>

          {/* Soft Amber Glow Filter */}
          <filter id="goldTraceGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pulse Radial Highlight */}
          <radialGradient id="pulseGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="45%" stopColor="#F5E4B8" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#C9A45C" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C9A45C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Blurred Golden Halo Underlay */}
        <path
          ref={glowPathRef}
          d=""
          fill="none"
          stroke="url(#goldTraceGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.32"
          filter="url(#goldTraceGlow)"
        />

        {/* Primary Sharp Golden Circuit Trace */}
        <path
          ref={pathRef}
          d=""
          fill="none"
          stroke="url(#goldTraceGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          filter="url(#goldTraceGlow)"
        />

        {/* Origin Emitter Node at BUILDING Code Card */}
        <g ref={emitterNodeRef} style={{ opacity: 0, transition: 'opacity 0.2s ease' }}>
          <circle r="8" fill="url(#pulseGlowGrad)" opacity="0.6" />
          <circle r="3.5" fill="#FFF8E7" />
          <circle r="1.5" fill="#FFFFFF" />
        </g>

        {/* Moving High-Tech Light Pulse at Leading Path Tip */}
        <g ref={pulseGroupRef} style={{ opacity: 0, transition: 'opacity 0.15s ease' }}>
          <circle ref={pulseHaloRef} r="9" fill="url(#pulseGlowGrad)" opacity="0.75" />
          <circle ref={pulseCoreRef} r="3.5" fill="#FFFFFF" />
        </g>

        {/* Destination Arrival Node at Skills Orbit */}
        <g ref={destNodeRef} style={{ opacity: 0, transition: 'opacity 0.25s ease' }}>
          <circle r="14" fill="url(#pulseGlowGrad)" opacity="0.45" />
          <circle r="6" fill="#C9A45C" opacity="0.8" />
          <circle r="2.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}
