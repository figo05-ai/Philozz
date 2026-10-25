'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ProjectSchematicVisual } from '@/components/ProjectSchematicVisual';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  (window as unknown as { ScrollTrigger?: typeof ScrollTrigger; gsap?: typeof gsap }).ScrollTrigger = ScrollTrigger;
  (window as unknown as { ScrollTrigger?: typeof ScrollTrigger; gsap?: typeof gsap }).gsap = gsap;
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

export function SkillsToProjectsTransition() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );

  const overlayRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const frame1Ref = useRef<HTMLElement>(null);
  const frame2Ref = useRef<HTMLElement>(null);
  const frame3Ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) return;

    const projectsSection = document.getElementById('projects');
    const skillsSection = document.getElementById('skills');
    if (!projectsSection || !skillsSection) return;

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 1024;

      // Select Skills Section Elements for Galaxy Collapse
      const orbitStage = document.querySelector<HTMLElement>('.tech-orbit-stage');
      const orbitSvg = document.querySelector<HTMLElement>('.tech-orbit-svg');
      const orbitBadge = document.querySelector<HTMLElement>('.orbit-center-badge');
      const pedestals = gsap.utils.toArray<HTMLElement>('.tech-pedestal-node');
      const skillsColLeft = document.querySelector<HTMLElement>('.tech-col-left');
      const skillsColRight = document.querySelector<HTMLElement>('.tech-col-right');

      // Select Projects Real Cards for Seamless Alignment Handoff
      const realCards = gsap.utils.toArray<HTMLElement>(
        '.projects-horizontal-gallery .gallery-project-card'
      );

      // Select Projects Header Elements for Restrained Cinematic Reveal
      const headerEyebrow = document.querySelector<HTMLElement>('.projects-header-wrapper .section-tag');
      const headerTitle = document.querySelector<HTMLElement>('.projects-editorial-heading');
      const headerDesc = document.querySelector<HTMLElement>('.projects-editorial-description');
      const headerElements = [headerEyebrow, headerTitle, headerDesc].filter(Boolean) as HTMLElement[];

      // Measure Dynamic Centers for Exact Projection Coordinates
      const calculateOffsets = () => {
        let destX0 = 0;
        let destX1 = 0;
        let destX2 = 0;
        let startY = -1100; // safe default

        const badge = document.querySelector<HTMLElement>('.orbit-center-badge');
        const gallery = document.querySelector<HTMLElement>('.projects-gallery-wrapper');

        if (badge && gallery) {
          const bRect = badge.getBoundingClientRect();
          const gRect = gallery.getBoundingClientRect();

          if (!isMobile && window.innerWidth >= 1280) {
            // Desktop: Vertical offset from galleryWrapper top to orbit badge center
            startY = (bRect.top + bRect.height / 2) - gRect.top;

            if (realCards.length >= 3) {
              const bCenterX = bRect.left + bRect.width / 2;
              const c0 = realCards[0].getBoundingClientRect();
              const c1 = realCards[1].getBoundingClientRect();
              const c2 = realCards[2].getBoundingClientRect();

              destX0 = bCenterX - (c0.left + c0.width / 2);
              destX1 = bCenterX - (c1.left + c1.width / 2);
              destX2 = bCenterX - (c2.left + c2.width / 2);
            }
          } else {
            // Mobile & Tablet: Restrained entrance offset so the blueprint frame is immediately visible in viewport
            startY = Math.max(-280, Math.round(-window.innerHeight * 0.32));
          }
        }

        // Vectors from each pedestal to the orbit central badge
        const pedestalVectors: { dx: number; dy: number }[] = [];
        if (badge && pedestals.length > 0) {
          const bRect = badge.getBoundingClientRect();
          const bCenterX = bRect.left + bRect.width / 2;
          const bCenterY = bRect.top + bRect.height / 2;

          pedestals.forEach((p) => {
            const pRect = p.getBoundingClientRect();
            const pCenterX = pRect.left + pRect.width / 2;
            const pCenterY = pRect.top + pRect.height / 2;
            pedestalVectors.push({
              dx: bCenterX - pCenterX,
              dy: bCenterY - pCenterY,
            });
          });
        }

        return { destX0, destX1, destX2, startY, pedestalVectors };
      };

      const { destX0, destX1, destX2, startY, pedestalVectors } = calculateOffsets();

      // Initial resting state: real cards hidden only when transition is active
      if (overlayRef.current) {
        gsap.set(overlayRef.current, { display: 'none', opacity: 0 });
      }

      // Initial wireframe frames setup: placed precisely AT the galaxy center
      if (frame1Ref.current && frame2Ref.current && frame3Ref.current) {
        if (!isMobile && window.innerWidth >= 1280) {
          gsap.set(frame1Ref.current, {
            x: destX0,
            y: startY,
            scale: 0.18,
            z: -250,
            opacity: 0,
            rotateY: 16,
            transformPerspective: 1200,
          });
          gsap.set(frame2Ref.current, {
            x: destX1,
            y: startY,
            scale: 0.18,
            z: -250,
            opacity: 0,
            rotateY: 0,
            transformPerspective: 1200,
          });
          gsap.set(frame3Ref.current, {
            x: destX2,
            y: startY,
            scale: 0.18,
            z: -250,
            opacity: 0,
            rotateY: -16,
            transformPerspective: 1200,
          });
        } else {
          // Tablet & Mobile
          gsap.set(frame1Ref.current, {
            x: 0,
            y: startY,
            scale: 0.22,
            opacity: 0,
          });
        }
      }

      // Create Dedicated Reversible GSAP Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'skills-to-projects',
          trigger: projectsSection,
          start: 'top bottom',
          end: isMobile ? '+=680' : '+=1300',
          scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress;

            // Overlay visibility gating: active from startP to endP
            if (overlayRef.current) {
              const startP = isMobile ? 0.05 : 0.10;
              const endP = isMobile ? 0.88 : 0.96;
              if (p >= startP && p <= endP) {
                overlayRef.current.style.display = 'block';
                // Protective clipping: before 0.65 open to galaxy; at >= 0.65 strictly protect heading above gallery
                if (p >= 0.65) {
                  overlayRef.current.style.clipPath = 'inset(-20px -200px -200px -200px)';
                } else {
                  overlayRef.current.style.clipPath = 'inset(-1600px -200px -200px -200px)';
                }
              } else {
                overlayRef.current.style.display = 'none';
              }
            }
          },
          onLeave: () => {
            // Stage 06 (100%): Projects Resting — clear inline overrides so cards are 100% interactive
            if (realCards.length > 0) {
              gsap.set(realCards, { clearProps: 'opacity,transform,visibility' });
            }
            if (orbitStage) gsap.set(orbitStage, { clearProps: 'transform,opacity' });
            if (orbitSvg) gsap.set(orbitSvg, { clearProps: 'transform,opacity' });
            if (orbitBadge) gsap.set(orbitBadge, { clearProps: 'transform,opacity' });
            if (pedestals.length > 0) gsap.set(pedestals, { clearProps: 'transform,opacity' });
            if (skillsColLeft) gsap.set(skillsColLeft, { clearProps: 'transform,opacity' });
            if (skillsColRight) gsap.set(skillsColRight, { clearProps: 'transform,opacity' });
            const telemetryEls = gsap.utils.toArray<HTMLElement>(
              '.wireframe-blueprint-telemetry, .wireframe-blueprint-status'
            );
            if (telemetryEls.length > 0) gsap.set(telemetryEls, { clearProps: 'opacity' });
            if (headerElements.length > 0) gsap.set(headerElements, { clearProps: 'opacity,transform,visibility' });

            if (overlayRef.current) {
              overlayRef.current.style.display = 'none';
              overlayRef.current.style.opacity = '0';
              overlayRef.current.style.clipPath = 'none';
            }
          },
          onLeaveBack: () => {
            // Reversing back to 0%: Skills Resting — pristine Skills Orbit restored
            if (realCards.length > 0) {
              gsap.set(realCards, { clearProps: 'opacity,transform,visibility' });
            }
            if (orbitStage) gsap.set(orbitStage, { clearProps: 'transform,opacity' });
            if (orbitSvg) gsap.set(orbitSvg, { clearProps: 'transform,opacity' });
            if (orbitBadge) gsap.set(orbitBadge, { clearProps: 'transform,opacity' });
            if (pedestals.length > 0) gsap.set(pedestals, { clearProps: 'transform,opacity' });
            if (skillsColLeft) gsap.set(skillsColLeft, { clearProps: 'transform,opacity' });
            if (skillsColRight) gsap.set(skillsColRight, { clearProps: 'transform,opacity' });
            const telemetryEls = gsap.utils.toArray<HTMLElement>(
              '.wireframe-blueprint-telemetry, .wireframe-blueprint-status'
            );
            if (telemetryEls.length > 0) gsap.set(telemetryEls, { clearProps: 'opacity' });
            if (headerElements.length > 0) gsap.set(headerElements, { clearProps: 'opacity,transform,visibility' });

            if (overlayRef.current) {
              overlayRef.current.style.display = 'none';
              overlayRef.current.style.opacity = '0';
              overlayRef.current.style.clipPath = 'none';
            }
          },
        },
      });

      // ========================================================
      // STAGE 01 & 02 — GALAXY STAGING & COLLAPSE (0.00 - 0.38)
      // Counter-translation holds the galaxy hub centered in the viewport
      // while nodes collapse into the central PHILOZZ hub!
      // ========================================================
      if (realCards.length > 0) {
        tl.set(realCards, { opacity: 0 }, 0);
      }
      if (headerElements.length > 0) {
        tl.set(headerElements, { opacity: 0, y: 24 }, 0);
      }

      // Editorial Narrative & Disciplines fade out immediately so they never collide with navbar
      if (skillsColLeft) {
        tl.to(
          skillsColLeft,
          {
            opacity: 0,
            y: -18,
            ease: 'power1.in',
            duration: 0.10,
          },
          0
        );
      }
      if (skillsColRight) {
        tl.to(
          skillsColRight,
          {
            opacity: 0,
            y: -18,
            ease: 'power1.in',
            duration: 0.10,
          },
          0
        );
      }

      // Counter-translation: moves orbit stage down by 360px while page scrolls up
      // Net movement in viewport is ~15px — galaxy stays centered right in front of viewer!
      if (orbitStage) {
        tl.to(
          orbitStage,
          {
            y: 360,
            scale: 0.40,
            opacity: 0.25,
            ease: 'power1.out',
            duration: 0.32,
          },
          0
        );
        // Fade out galaxy stage completely once frames are hovering and heading enters
        tl.to(
          orbitStage,
          {
            opacity: 0,
            duration: 0.10,
            ease: 'power1.in',
          },
          0.34
        );
      }

      // Pedestals fly inward into central hub (active 0.04 - 0.26)
      if (pedestals.length > 0 && pedestalVectors.length > 0) {
        pedestals.forEach((node, idx) => {
          const vec = pedestalVectors[idx] || { dx: 0, dy: 0 };
          tl.to(
            node,
            {
              x: vec.dx * 0.94,
              y: vec.dy * 0.94,
              scale: 0.10,
              opacity: 0,
              ease: 'power2.in',
              duration: 0.22,
            },
            0.04 + (idx % 3) * 0.015
          );
        });
      }

      // Glowing Orbit SVG rings contract into hub
      if (orbitSvg) {
        tl.to(
          orbitSvg,
          {
            scale: 0.22,
            rotation: -16,
            opacity: 0.15,
            ease: 'power2.in',
            duration: 0.24,
          },
          0.04
        );
      }

      // Central Hub Badge condenses
      if (orbitBadge) {
        tl.to(
          orbitBadge,
          {
            scale: 0.60,
            opacity: 0.35,
            ease: 'power2.in',
            duration: 0.24,
          },
          0.04
        );
      }

      // ========================================================
      // STAGE 03 — 3D FRAME EMERGENCE & PERSPECTIVE STAGING (0.18 - 0.60)
      // Frames emerge from the collapsing galaxy center starting at 0.18.
      // They expand into a wide perspective array within the galaxy zone,
      // held strictly ABOVE the Projects heading until the heading passes.
      // ========================================================
      if (overlayRef.current) {
        tl.to(
          overlayRef.current,
          {
            opacity: 1,
            duration: 0.04,
            ease: 'none',
          },
          isMobile ? 0.06 : 0.18
        );
      }

      if (!isMobile && window.innerWidth >= 1280) {
        // Desktop 3-Frame Emergence & Trajectory
        // Phase 3A: Emergence from galaxy center to 3D perspective fan (0.18 - 0.36)
        // Staged at y: startY (locked at galaxy hub, >220px above heading top)
        if (frame1Ref.current) {
          tl.to(
            frame1Ref.current,
            {
              x: destX0 * 0.28,
              y: startY,
              scale: 0.66,
              z: -50,
              rotateY: 16,
              opacity: 1,
              ease: 'power2.out',
              duration: 0.18,
            },
            0.18
          );
          // Phase 3B: Staging Hold in galaxy zone while heading scrolls past (0.36 - 0.65)
          // Keeps frames strictly anchored to galaxy (>270px above heading top). Zero text occlusion!
          tl.to(
            frame1Ref.current,
            {
              x: destX0 * 0.22,
              y: startY,
              scale: 0.70,
              z: -40,
              rotateY: 14,
              ease: 'power1.inOut',
              duration: 0.29,
            },
            0.36
          );
          // Phase 3C: Glide down from staging zone directly into exact card column (0.65 - 0.80)
          // Executes as the gallery enters the viewport below the heading
          tl.to(
            frame1Ref.current,
            {
              x: 0,
              y: 0,
              scale: 1.0,
              z: 0,
              rotateY: 0,
              ease: 'power2.inOut',
              duration: 0.15,
            },
            0.65
          );
        }

        if (frame2Ref.current) {
          tl.to(
            frame2Ref.current,
            {
              x: destX1 * 0.28,
              y: startY,
              scale: 0.68,
              z: -30,
              rotateY: 0,
              opacity: 1,
              ease: 'power2.out',
              duration: 0.18,
            },
            0.18
          );
          tl.to(
            frame2Ref.current,
            {
              x: destX1 * 0.22,
              y: startY,
              scale: 0.72,
              z: -20,
              rotateY: 0,
              ease: 'power1.inOut',
              duration: 0.29,
            },
            0.36
          );
          tl.to(
            frame2Ref.current,
            {
              x: 0,
              y: 0,
              scale: 1.0,
              z: 0,
              rotateY: 0,
              ease: 'power2.inOut',
              duration: 0.15,
            },
            0.65
          );
        }

        if (frame3Ref.current) {
          tl.to(
            frame3Ref.current,
            {
              x: destX2 * 0.28,
              y: startY,
              scale: 0.66,
              z: -50,
              rotateY: -16,
              opacity: 1,
              ease: 'power2.out',
              duration: 0.18,
            },
            0.18
          );
          tl.to(
            frame3Ref.current,
            {
              x: destX2 * 0.22,
              y: startY,
              scale: 0.70,
              z: -40,
              rotateY: -14,
              ease: 'power1.inOut',
              duration: 0.29,
            },
            0.36
          );
          tl.to(
            frame3Ref.current,
            {
              x: 0,
              y: 0,
              scale: 1.0,
              z: 0,
              rotateY: 0,
              ease: 'power2.inOut',
              duration: 0.15,
            },
            0.65
          );
        }
      } else {
        // Mobile / Small Screen 1-Frame Emergence
        if (frame1Ref.current) {
          tl.to(
            frame1Ref.current,
            {
              x: 0,
              y: startY,
              scale: 0.78,
              opacity: 1,
              ease: 'power2.out',
              duration: 0.16,
            },
            0.06
          );
          tl.to(
            frame1Ref.current,
            {
              x: 0,
              y: Math.round(startY * 0.35),
              scale: 0.88,
              ease: 'power1.inOut',
              duration: 0.22,
            },
            0.22
          );
          tl.to(
            frame1Ref.current,
            {
              x: 0,
              y: 0,
              scale: 1.0,
              ease: 'power2.inOut',
              duration: 0.16,
            },
            0.46
          );
        }
      }

      // ========================================================
      // PROJECTS EDITORIAL HEADING REVEAL
      // On desktop: 0.46 - 0.64
      // On mobile: 0.18 - 0.36 (immediate visibility, zero black screen)
      // ========================================================
      if (headerElements.length > 0) {
        tl.to(
          headerElements,
          {
            opacity: 1,
            y: 0,
            stagger: 0.06,
            duration: 0.18,
            ease: 'power2.out',
          },
          isMobile ? 0.18 : 0.46
        );
      }

      // ========================================================
      // STAGE 04 — SETTLED 1:1 ALIGNMENT HOLD
      // ========================================================

      // ========================================================
      // STAGE 05 — SEAMLESS 1:1 MATERIALIZATION CROSSFADE
      // ========================================================
      const telemetryElements = gsap.utils.toArray<HTMLElement>(
        '.wireframe-blueprint-telemetry, .wireframe-blueprint-status'
      );
      if (telemetryElements.length > 0) {
        tl.to(
          telemetryElements,
          {
            opacity: 0,
            duration: 0.04,
            ease: 'power1.out',
          },
          isMobile ? 0.60 : 0.85
        );
      }

      if (frame1Ref.current && frame2Ref.current && frame3Ref.current) {
        tl.to(
          [frame1Ref.current, frame2Ref.current, frame3Ref.current],
          {
            opacity: 0,
            ease: 'power1.inOut',
            duration: 0.08,
          },
          isMobile ? 0.62 : 0.86
        );
      }

      if (realCards.length > 0) {
        tl.fromTo(
          realCards,
          {
            opacity: 0,
          },
          {
            opacity: 1,
            ease: 'power1.inOut',
            duration: 0.10,
          },
          isMobile ? 0.60 : 0.85
        );
      }

      // ========================================================
      // STAGE 06 — PROJECTS RESTING
      // ========================================================
      if (overlayRef.current) {
        tl.to(
          overlayRef.current,
          {
            opacity: 0,
            duration: 0.04,
            ease: 'none',
          },
          isMobile ? 0.72 : 0.94
        );
      }
    });

    const handleResize = () => {
      ScrollTrigger.getById('skills-to-projects')?.refresh();
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
      ref={overlayRef}
      className="skills-to-projects-transition-layer"
      aria-hidden="true"
    >
      <div className="skills-to-projects-stage">
        <div ref={gridRef} className="skills-to-projects-grid">
          {/* FRAME 1: SkillUp Platform */}
          <article ref={frame1Ref} className="transition-wireframe-frame frame-1">
            <div className="wireframe-corner wireframe-corner-tl" />
            <div className="wireframe-corner wireframe-corner-tr" />
            <div className="wireframe-corner wireframe-corner-bl" />
            <div className="wireframe-corner wireframe-corner-br" />

            {/* Visual Schematic Top Section */}
            <div className="gallery-card-visual wireframe-visual-container">
              <ProjectSchematicVisual
                type="skillup-horizon"
                slug="skillup-platform"
                variant="compact"
              />
            </div>

            {/* Blueprint Architecture Body Section */}
            <div className="gallery-card-body wireframe-card-body">
              <div className="gallery-card-meta wireframe-card-meta">
                <span className="gallery-index-tag wireframe-index-tag">01</span>
                <span className="gallery-meta-divider wireframe-meta-divider">/</span>
                <span className="gallery-category-label wireframe-category-label">HIGH-CONCURRENCY ARCHITECTURE</span>
              </div>

              <h3 className="gallery-project-title wireframe-project-title">
                SkillUp Platform
              </h3>

              <div className="wireframe-blueprint-telemetry">
                <div className="wireframe-telemetry-row">
                  <span className="telemetry-label">THROUGHPUT</span>
                  <span className="telemetry-value">100K REQ/SEC</span>
                </div>
                <div className="wireframe-telemetry-row">
                  <span className="telemetry-label">LATENCY P99</span>
                  <span className="telemetry-value">&lt;50MS REDIS</span>
                </div>
                <div className="wireframe-telemetry-row">
                  <span className="telemetry-label">DISPATCH ENGINE</span>
                  <span className="telemetry-value">HORIZON WORKERS</span>
                </div>
              </div>
            </div>

            {/* Blueprint Status Footer Section */}
            <div className="gallery-card-footer wireframe-card-footer">
              <div className="wireframe-blueprint-status">
                <span className="wireframe-blueprint-tag">SYSTEM BLUEPRINT // READY</span>
              </div>
            </div>
          </article>

          {/* FRAME 2: SmartPOS ERP */}
          <article ref={frame2Ref} className="transition-wireframe-frame frame-2">
            <div className="wireframe-corner wireframe-corner-tl" />
            <div className="wireframe-corner wireframe-corner-tr" />
            <div className="wireframe-corner wireframe-corner-bl" />
            <div className="wireframe-corner wireframe-corner-br" />

            {/* Visual Schematic Top Section */}
            <div className="gallery-card-visual wireframe-visual-container">
              <ProjectSchematicVisual
                type="smartpos-hardware"
                slug="smartpos-erp"
                variant="compact"
              />
            </div>

            {/* Blueprint Architecture Body Section */}
            <div className="gallery-card-body wireframe-card-body">
              <div className="gallery-card-meta wireframe-card-meta">
                <span className="gallery-index-tag wireframe-index-tag">02</span>
                <span className="gallery-meta-divider wireframe-meta-divider">/</span>
                <span className="gallery-category-label wireframe-category-label">DESKTOP RUNTIME & HARDWARE I/O</span>
              </div>

              <h3 className="gallery-project-title wireframe-project-title">
                SmartPOS ERP
              </h3>

              <div className="wireframe-blueprint-telemetry">
                <div className="wireframe-telemetry-row">
                  <span className="telemetry-label">HARDWARE I/O</span>
                  <span className="telemetry-value">USB / SCANNER SYNC</span>
                </div>
                <div className="wireframe-telemetry-row">
                  <span className="telemetry-label">OFFLINE STORAGE</span>
                  <span className="telemetry-value">SQLITE RESILIENT</span>
                </div>
                <div className="wireframe-telemetry-row">
                  <span className="telemetry-label">RUNTIME ENGINE</span>
                  <span className="telemetry-value">NATIVEPHP THREADS</span>
                </div>
              </div>
            </div>

            {/* Blueprint Status Footer Section */}
            <div className="gallery-card-footer wireframe-card-footer">
              <div className="wireframe-blueprint-status">
                <span className="wireframe-blueprint-tag">SYSTEM BLUEPRINT // READY</span>
              </div>
            </div>
          </article>

          {/* FRAME 3: Tanqia Skills */}
          <article ref={frame3Ref} className="transition-wireframe-frame frame-3">
            <div className="wireframe-corner wireframe-corner-tl" />
            <div className="wireframe-corner wireframe-corner-tr" />
            <div className="wireframe-corner wireframe-corner-bl" />
            <div className="wireframe-corner wireframe-corner-br" />

            {/* Visual Schematic Top Section */}
            <div className="gallery-card-visual wireframe-visual-container">
              <ProjectSchematicVisual
                type="tanqia-pipeline"
                slug="tanqia-skills"
                variant="compact"
              />
            </div>

            {/* Blueprint Architecture Body Section */}
            <div className="gallery-card-body wireframe-card-body">
              <div className="gallery-card-meta wireframe-card-meta">
                <span className="gallery-index-tag wireframe-index-tag">03</span>
                <span className="gallery-meta-divider wireframe-meta-divider">/</span>
                <span className="gallery-category-label wireframe-category-label">WORKFLOW AUTOMATION & QUEUES</span>
              </div>

              <h3 className="gallery-project-title wireframe-project-title">
                Tanqia Skills
              </h3>

              <div className="wireframe-blueprint-telemetry">
                <div className="wireframe-telemetry-row">
                  <span className="telemetry-label">STREAM INGESTION</span>
                  <span className="telemetry-value">CHUNKED 50K ROWS</span>
                </div>
                <div className="wireframe-telemetry-row">
                  <span className="telemetry-label">MUTEX LOCK</span>
                  <span className="telemetry-value">MYSQL ADVISORY</span>
                </div>
                <div className="wireframe-telemetry-row">
                  <span className="telemetry-label">PIPELINE QUEUE</span>
                  <span className="telemetry-value">ASYNC DELEGATION</span>
                </div>
              </div>
            </div>

            {/* Blueprint Status Footer Section */}
            <div className="gallery-card-footer wireframe-card-footer">
              <div className="wireframe-blueprint-status">
                <span className="wireframe-blueprint-tag">SYSTEM BLUEPRINT // READY</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
