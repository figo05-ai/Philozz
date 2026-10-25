'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Feather } from 'lucide-react';

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

export function ProjectsToBlogTransition() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );

  const overlayRef = useRef<HTMLDivElement>(null);
  const folioRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const unfoldingLeafRef = useRef<HTMLDivElement>(null);
  const creaseShadowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) return;

    const projectsSection = document.getElementById('projects');
    const blogSection = document.getElementById('blog');
    if (!projectsSection || !blogSection) return;

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 1024;

      // Select Featured Projects Real Cards
      const realCards = gsap.utils.toArray<HTMLElement>(
        '.projects-horizontal-gallery .gallery-project-card'
      );
      const card0 = realCards[0];

      // Select Projects Toggle Wrapper
      const projectsToggle = document.querySelector<HTMLElement>('.projects-toggle-wrapper');

      // Select Blog Real Elements for Knowledge Reveal
      const blogHeaderWrapper = document.querySelector<HTMLElement>('.notes-header-wrapper');
      const blogHeaderElements = blogHeaderWrapper
        ? (Array.from(blogHeaderWrapper.children) as HTMLElement[])
        : [];
      const blogPortrait = document.querySelector<HTMLElement>('.journal-portrait-card');
      const blogArticles = gsap.utils.toArray<HTMLElement>('.journal-article-card');
      const blogToggle = document.querySelector<HTMLElement>('.journal-toggle-wrapper');

      // Calculate Dynamic Card Dimensions & Viewport Center Offsets
      const measureCoordinates = () => {
        let initialWidth = 397;
        let initialHeight = 505;
        let startX = -430;
        let startY = 0;
        let y_at_008 = -76;
        let y_at_015 = -139;
        let y_at_017 = -157;

        const originCard = isMobile ? (realCards[realCards.length - 1] || card0) : card0;

        if (originCard && blogSection) {
          const c0Rect = originCard.getBoundingClientRect();
          const bRect = blogSection.getBoundingClientRect();

          initialWidth = Math.round(c0Rect.width) || (isMobile ? 340 : 397);
          initialHeight = Math.round(c0Rect.height) || (isMobile ? 460 : 505);

          // Absolute document positions (independent of current scrollY)
          const cardDocTop = c0Rect.top + window.scrollY;
          const cardDocLeft = c0Rect.left + window.scrollX;
          const blogDocTop = bRect.top + window.scrollY;

          // Scroll position when transition trigger starts (top bottom => blog enters viewport)
          const scrollStart = blogDocTop - window.innerHeight;
          const totalDistance = window.innerHeight;

          // Origin card viewport coordinates at transition start (p = 0.00)
          const cardViewportTopAtStart = cardDocTop - scrollStart;
          const cardViewportCenterX = cardDocLeft + initialWidth / 2;
          const cardViewportCenterY = cardViewportTopAtStart + initialHeight / 2;

          // Offset from viewport center (since .manuscript-stage is centered)
          startX = Math.round(cardViewportCenterX - window.innerWidth / 2);
          startY = Math.round(cardViewportCenterY - window.innerHeight / 2);

          // Card center Y at progress 0.08, 0.15, and 0.17
          y_at_008 = Math.round(startY - 0.08 * totalDistance);
          y_at_015 = Math.round(startY - 0.15 * totalDistance);
          y_at_017 = Math.round(startY - 0.17 * totalDistance);
        }

        // Target dimensions for unfolded manuscript
        let targetWidth = Math.min(1060, Math.round(window.innerWidth * 0.86));
        let targetHeight = Math.min(540, Math.round(window.innerHeight * 0.65));
        let targetX = 0;
        let targetY = -15;

        if (isMobile) {
          targetWidth = Math.round(window.innerWidth * 0.90);
          targetHeight = Math.min(440, Math.round(window.innerHeight * 0.58));
          targetX = 0;
          targetY = 10;
        }

        return {
          initialWidth,
          initialHeight,
          startX,
          startY,
          y_at_008,
          y_at_015,
          y_at_017,
          targetWidth,
          targetHeight,
          targetX,
          targetY,
        };
      };

      const coords = measureCoordinates();
      const originCard = isMobile ? (realCards[realCards.length - 1] || card0) : card0;
      const otherCards = realCards.filter((c) => c !== originCard);

      // Initial Overlay State
      if (overlayRef.current) {
        gsap.set(overlayRef.current, { display: 'none', opacity: 1 });
      }

      // Initial Folio State matching originCard at p = 0.08
      if (folioRef.current) {
        gsap.set(folioRef.current, {
          x: coords.startX,
          y: coords.y_at_008,
          width: coords.initialWidth,
          height: coords.initialHeight,
          scale: 1.0,
          z: 0,
          opacity: 0,
          transformPerspective: 1600,
        });
      }

      // Initial Leaf 3D Rotation State (folded shut at start)
      if (unfoldingLeafRef.current) {
        gsap.set(unfoldingLeafRef.current, {
          rotateY: isMobile ? 0 : -55,
          rotateX: isMobile ? -30 : 6,
          opacity: 0,
          transformPerspective: 1600,
        });
      }

      // Initial Content State (hidden until unfolding at 0.35)
      if (contentRef.current) {
        gsap.set(contentRef.current, { opacity: 0 });
      }

      // Initial Backdrop State (transparent outline at start, materializes upon 3D extraction)
      if (backdropRef.current) {
        gsap.set(backdropRef.current, { opacity: 0 });
      }

      // Dedicated ScrollTrigger Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'projects-to-blog',
          trigger: blogSection,
          start: 'top bottom',
          end: 'top top',
          scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress;

            // Overlay active strictly during manuscript transformation phase
            if (overlayRef.current) {
              const endP = isMobile ? 0.70 : 0.76;
              if (p >= 0.08 && p <= endP) {
                overlayRef.current.style.display = 'block';
                overlayRef.current.style.pointerEvents = 'none';
              } else {
                overlayRef.current.style.display = 'none';
              }
            }
          },
          onLeave: () => {
            // Stage 05 (100%): Blog Resting — clear props on Blog elements so normal reading & links are pristine
            if (blogHeaderElements.length > 0) {
              gsap.set(blogHeaderElements, { clearProps: 'opacity,transform,clipPath,visibility' });
            }
            if (blogPortrait) gsap.set(blogPortrait, { clearProps: 'opacity,transform,visibility' });
            if (blogArticles.length > 0) {
              gsap.set(blogArticles, { clearProps: 'opacity,transform,visibility' });
            }
            if (blogToggle) gsap.set(blogToggle, { clearProps: 'opacity,transform,visibility' });
            if (overlayRef.current) {
              overlayRef.current.style.display = 'none';
            }
          },
          onLeaveBack: () => {
            // Reverse Back to 0%: Projects Resting — pristine Featured Projects restored
            if (realCards.length > 0) {
              gsap.set(realCards, { clearProps: 'opacity,transform,visibility,boxShadow,borderColor' });
            }
            if (projectsToggle) gsap.set(projectsToggle, { clearProps: 'opacity' });
            if (blogToggle) gsap.set(blogToggle, { clearProps: 'opacity,transform,visibility' });
            if (overlayRef.current) {
              overlayRef.current.style.display = 'none';
            }
          },
        },
      });

      // ========================================================
      // STAGE 01 — PROJECTS RESTING & EXTRACTION PREPARATION (0.00 - 0.15)
      // Cards remain readable and interactive at 0%. As scroll advances,
      // originCard begins glowing with champagne-gold outline, while other cards
      // gently recede into subtle depth.
      // ========================================================
      if (originCard) {
        tl.to(
          originCard,
          {
            boxShadow: '0 0 32px rgba(201, 164, 92, 0.45)',
            borderColor: 'rgba(245, 228, 184, 0.75)',
            duration: 0.15,
            ease: 'power1.out',
          },
          0
        );
      }
      if (otherCards.length > 0) {
        tl.to(
          otherCards,
          {
            scale: 0.95,
            z: -35,
            opacity: 0.75,
            duration: 0.15,
            ease: 'power1.out',
          },
          0
        );
      }

      if (projectsToggle) {
        tl.to(
          projectsToggle,
          {
            opacity: 0,
            duration: 0.12,
            ease: 'power1.out',
          },
          isMobile ? 0.18 : 0.08
        );
      }

      // Folio smoothly matches originCard from p = 0.08 to 0.15
      if (folioRef.current) {
        tl.fromTo(
          folioRef.current,
          {
            y: coords.y_at_008,
            opacity: 0,
          },
          {
            y: coords.y_at_015,
            opacity: 1,
            duration: 0.07,
            ease: 'none',
          },
          0.08
        );
      }

      // ========================================================
      // STAGE 02 — EDITORIAL EXTRACTION (0.15 - 0.35)
      // OriginCard crossfades underneath while perfectly matched.
      // At 0.15, folio takes off smoothly in 3D perspective toward center stage.
      // Other cards recede deeper into depth.
      // ========================================================
      if (originCard) {
        tl.fromTo(
          originCard,
          { opacity: 1 },
          {
            opacity: 0,
            duration: 0.08,
            ease: 'power1.inOut',
          },
          0.15
        );
      }

      if (backdropRef.current) {
        tl.fromTo(
          backdropRef.current,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.12,
            ease: 'power1.inOut',
          },
          0.15
        );
      }

      if (folioRef.current) {
        tl.fromTo(
          folioRef.current,
          {
            x: coords.startX,
            y: coords.y_at_015,
            z: 0,
            scale: 1.0,
            rotateX: 0,
            rotateY: 0,
          },
          {
            x: Math.round(coords.startX * 0.45),
            y: Math.round((coords.y_at_015 + coords.targetY) * 0.5),
            z: 45,
            scale: 1.03,
            rotateX: 3,
            rotateY: isMobile ? 0 : -3,
            duration: 0.20,
            ease: 'power2.inOut',
          },
          0.15
        );
      }

      if (otherCards.length > 0) {
        tl.to(
          otherCards,
          {
            scale: 0.88,
            z: -100,
            opacity: 0.15,
            duration: 0.20,
            ease: 'power2.inOut',
          },
          0.15
        );
      }

      // ========================================================
      // STAGE 03 — MANUSCRIPT UNFOLDING (0.35 - 0.54)
      // Folio expands in 3D perspective toward center stage.
      // The right leaf unfolds with 3D rotation.
      // Inner principles and discourse reveal in gold & ivory.
      // ========================================================
      if (folioRef.current) {
        tl.to(
          folioRef.current,
          {
            x: coords.targetX,
            y: coords.targetY,
            width: coords.targetWidth,
            height: coords.targetHeight,
            scale: 1.0,
            z: 30,
            rotateX: 0,
            rotateY: 0,
            duration: 0.19,
            ease: 'power2.inOut',
          },
          0.35
        );
      }

      if (unfoldingLeafRef.current) {
        tl.to(
          unfoldingLeafRef.current,
          {
            rotateY: 0,
            rotateX: 0,
            opacity: 1,
            duration: 0.19,
            ease: 'power2.out',
          },
          0.35
        );
      }

      if (creaseShadowRef.current) {
        tl.to(
          creaseShadowRef.current,
          {
            opacity: 0,
            duration: 0.14,
            ease: 'power1.out',
          },
          0.38
        );
      }

      if (contentRef.current) {
        tl.fromTo(
          contentRef.current,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.12,
            ease: 'power1.out',
          },
          0.36
        );
      }

      if (otherCards.length > 0) {
        tl.to(
          otherCards,
          {
            opacity: 0,
            duration: 0.10,
            ease: 'power1.out',
          },
          0.35
        );
      }

      // ========================================================
      // STAGE 04 — CONTINUOUS KNOWLEDGE REVEAL (0.50 - 0.76)
      // FIX FOR PROBLEM 1: Continuous crossfade & reveal!
      // Real Blog HTML elements reveal smoothly while the manuscript
      // dissolves into the background. Zero black frames, zero text collision!
      // ========================================================
      // 1. Manuscript inner text dissolves first (0.50 - 0.60)
      if (contentRef.current) {
        tl.to(
          contentRef.current,
          {
            opacity: 0,
            duration: 0.10,
            ease: 'power1.in',
          },
          0.50
        );
      }

      // 2. Manuscript folio shell dissolves and lifts subtly
      if (folioRef.current) {
        tl.to(
          folioRef.current,
          {
            y: coords.targetY - 45,
            scale: 1.06,
            opacity: 0,
            duration: 0.18,
            ease: 'power2.inOut',
          },
          isMobile ? 0.46 : 0.54
        );
      }

      // 3. Real Blog Header Reveal begins as folio text clears
      if (blogHeaderElements.length > 0) {
        tl.fromTo(
          blogHeaderElements,
          {
            opacity: 0,
            y: 28,
            clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
          },
          {
            opacity: 1,
            y: 0,
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            stagger: 0.03,
            duration: 0.16,
            ease: 'power2.out',
          },
          isMobile ? 0.44 : 0.58
        );
      }

      // 4. Real Blog Portrait & Articles Reveal in coordinated stagger
      if (blogPortrait) {
        tl.fromTo(
          blogPortrait,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.16,
            ease: 'power2.out',
          },
          isMobile ? 0.48 : 0.60
        );
      }

      if (blogArticles.length > 0) {
        tl.fromTo(
          blogArticles,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.03,
            duration: 0.16,
            ease: 'power2.out',
          },
          isMobile ? 0.50 : 0.60
        );
      }

      if (blogToggle) {
        tl.fromTo(
          blogToggle,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.16,
            ease: 'power2.out',
          },
          isMobile ? 0.52 : 0.63
        );
      }

      // ========================================================
      // STAGE 05 — BLOG RESTING (0.80 - 1.00)
      // The Engineering Journal is fully visible, readable, and interactive.
      // All temporary overlays have opacity: 0 and pointer-events: none.
      // ========================================================
      // Pad timeline duration to exactly 1.0 so ScrollTrigger progress maps 1:1 with timeline time
      tl.to({}, { duration: 0.001 }, 1.0);
    });

    const handleResize = () => {
      ScrollTrigger.getById('projects-to-blog')?.refresh();
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
      className="projects-to-blog-transition-layer"
      aria-hidden="true"
    >
      <div className="manuscript-stage">
        <div ref={folioRef} className="manuscript-folio">
          {/* Obsidian Editorial Backdrop */}
          <div ref={backdropRef} className="manuscript-backdrop" />

          {/* Champagne Gold Luxury Corner Register Marks */}
          <div className="manuscript-bracket manuscript-bracket-tl" />
          <div className="manuscript-bracket manuscript-bracket-tr" />
          <div className="manuscript-bracket manuscript-bracket-bl" />
          <div className="manuscript-bracket manuscript-bracket-br" />

          {/* Folio Watermark Header */}
          <div className="manuscript-watermark-bar">
            <div className="manuscript-watermark-tag">
              <Feather size={13} style={{ color: 'var(--color-gold)' }} />
              <span>THE ENGINEERING MANUSCRIPT // FOLIO 01</span>
            </div>
            <span className="manuscript-watermark-badge">SYSTEMS &rarr; DISCOURSE</span>
          </div>

          {/* Two-Leaf Folio Spread */}
          <div ref={contentRef} className="manuscript-spread">
            {/* Left Leaf: Extraction from Production Systems */}
            <div className="manuscript-leaf manuscript-leaf-left">
              <div className="manuscript-leaf-inner">
                <div>
                  <div className="manuscript-leaf-meta">
                    <span className="manuscript-folio-index">01</span>
                    <span className="manuscript-meta-sep">/</span>
                    <span className="manuscript-leaf-type">SYSTEM PROVENANCE</span>
                  </div>

                  <h3 className="manuscript-leaf-title">SkillUp Platform</h3>
                  <div className="manuscript-leaf-subtitle">
                    High-Concurrency Backend &bull; Horizon Queue Pipeline
                  </div>

                  <div className="manuscript-divider-line" />

                  <blockquote className="manuscript-axiom-quote">
                    &ldquo;Code implements today&rsquo;s requirements. Architecture distills principles that endure.&rdquo;
                  </blockquote>
                </div>

                <div className="manuscript-telemetry-box">
                  <div className="manuscript-telemetry-item">
                    <span className="manuscript-telemetry-lbl">THROUGHPUT PROFILE</span>
                    <span className="manuscript-telemetry-val">100K REQ/SEC SPIKE</span>
                  </div>
                  <div className="manuscript-telemetry-item">
                    <span className="manuscript-telemetry-lbl">LATENCY BOUND</span>
                    <span className="manuscript-telemetry-val">&lt;50MS REDIS CACHED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Leaf: Unfolding 3D Leaf into Knowledge & Discourse */}
            <div ref={unfoldingLeafRef} className="manuscript-leaf manuscript-leaf-right">
              {/* Dynamic 3D Crease Shadow */}
              <div ref={creaseShadowRef} className="manuscript-crease-shadow" />

              <div className="manuscript-leaf-inner">
                <div>
                  <div className="manuscript-leaf-meta">
                    <span className="manuscript-folio-index">JOURNAL</span>
                    <span className="manuscript-meta-sep">/</span>
                    <span className="manuscript-leaf-type">ENGINEERING DISCOURSE</span>
                  </div>

                  <h3 className="manuscript-leaf-title">
                    The Engineering Journal
                  </h3>
                  <div className="manuscript-leaf-subtitle">
                    Thoughts. Learnings. Architectural Progress.
                  </div>

                  <div className="manuscript-divider-line" />

                  <div className="manuscript-topics-list">
                    <div className="manuscript-topic-row">
                      <span>Queue Topologies &amp; Asynchronous Workflows</span>
                    </div>
                    <div className="manuscript-topic-row">
                      <span>Database Query Optimization &amp; Locks</span>
                    </div>
                    <div className="manuscript-topic-row">
                      <span>System Architecture Mindset at Scale</span>
                    </div>
                  </div>
                </div>

                <div className="manuscript-leaf-footer-tag">
                  <Sparkles size={13} style={{ color: 'var(--color-gold)' }} />
                  <span>DECONSTRUCTING PRODUCTION TO EXPEDITE WISDOM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
