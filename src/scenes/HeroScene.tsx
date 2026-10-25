'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { ArrowRight, MessageSquare, Terminal } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BRAND_INFO } from '@/data/portfolioData';
import { AboutScene } from '@/scenes/AboutScene';

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

export function HeroScene() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );

  const heroRef = useRef<HTMLElement>(null);
  const bgWrapRef = useRef<HTMLDivElement>(null);
  const bgInnerRef = useRef<HTMLDivElement>(null);
  const signatureRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const metricsRowRef = useRef<HTMLDivElement>(null);
  const mobileFrameRef = useRef<HTMLDivElement>(null);
  const typographyRef = useRef<HTMLDivElement>(null);
  const workstationGlowRef = useRef<HTMLDivElement>(null);
  const lightSweepRef = useRef<HTMLDivElement>(null);
  const aboutRevealRef = useRef<HTMLDivElement>(null);

  // Guards entrance animation from running multiple times
  const hasAnimatedRef = useRef(false);

  // Coordinated Entrance & Scroll-Driven GSAP Transition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth <= 960;

    const ctx = gsap.context(() => {
      // ----------------------------------------------------
      // 1. CINEMATIC ENTRANCE ANIMATION (First-time mount only)
      // ----------------------------------------------------
      const isScrolledDown = window.scrollY > 60;
      if (isScrolledDown) {
        hasAnimatedRef.current = true;
      }

      if (!prefersReducedMotion && !hasAnimatedRef.current) {
        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          onComplete: () => {
            hasAnimatedRef.current = true;
          },
        });

        if (bgInnerRef.current) gsap.set(bgInnerRef.current, { scale: 1.035, opacity: 0.85 });
        if (eyebrowRef.current) gsap.set(eyebrowRef.current, { y: 18, opacity: 0 });
        const titleLines = gsap.utils.toArray<HTMLElement>('.hero-editorial-title .title-line');
        if (titleLines.length > 0) gsap.set(titleLines, { y: 22, opacity: 0 });
        if (descRef.current) gsap.set(descRef.current, { y: 18, opacity: 0 });
        if (ctaGroupRef.current) gsap.set(ctaGroupRef.current, { y: 16, opacity: 0 });
        if (metricsRowRef.current) gsap.set(metricsRowRef.current, { y: 16, opacity: 0 });
        if (signatureRef.current) gsap.set(signatureRef.current, { opacity: 0, x: 20 });
        if (mobileFrameRef.current) gsap.set(mobileFrameRef.current, { opacity: 0, y: 18 });

        // 0. Ambient push-in of background photograph
        if (bgInnerRef.current) {
          tl.to(
            bgInnerRef.current,
            {
              scale: 1,
              opacity: 1,
              duration: 1.4,
              ease: 'power2.out',
            },
            0
          );
        }

        // 1. FULL-STACK DEVELOPER eyebrow tag (.hero-eyebrow-tag)
        if (eyebrowRef.current) {
          tl.to(
            eyebrowRef.current,
            {
              y: 0,
              opacity: 1,
              duration: 0.55,
              clearProps: 'transform,opacity',
            },
            0.10
          );
        }

        // 2, 3, 4. Headline lines staggered (.hero-editorial-title .title-line)
        // "Full-Stack", "Engineer.", "Backend at Heart."
        if (titleLines.length > 0) {
          tl.to(
            titleLines,
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              stagger: 0.12,
              clearProps: 'transform,opacity',
            },
            0.25
          );
        }

        // Mobile visual frame (rendered only on mobile viewports)
        if (mobileFrameRef.current) {
          tl.to(
            mobileFrameRef.current,
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              clearProps: 'transform,opacity',
            },
            0.50
          );
        }

        // 5. Supporting description (.hero-editorial-description)
        if (descRef.current) {
          tl.to(
            descRef.current,
            {
              y: 0,
              opacity: 1,
              duration: 0.55,
              clearProps: 'transform,opacity',
            },
            0.65
          );
        }

        // 6. View My Work and Let's Talk buttons (.hero-editorial-cta-group)
        if (ctaGroupRef.current) {
          tl.to(
            ctaGroupRef.current,
            {
              y: 0,
              opacity: 1,
              duration: 0.50,
              clearProps: 'transform,opacity',
            },
            0.80
          );
        }

        // Editorial signature lockup (desktop brand script)
        if (signatureRef.current) {
          tl.to(
            signatureRef.current,
            {
              x: 0,
              opacity: 1,
              duration: 0.65,
              clearProps: 'transform,opacity',
            },
            0.88
          );
        }

        // 7. Experience, projects, and curiosity metrics (.hero-editorial-metrics-row)
        if (metricsRowRef.current) {
          tl.to(
            metricsRowRef.current,
            {
              y: 0,
              opacity: 1,
              duration: 0.55,
              clearProps: 'transform,opacity',
            },
            0.95
          );
        }
      }

      // ----------------------------------------------------
      // 2. SCROLL-DRIVEN GOLDEN LIGHT TRANSITION (Desktop only)
      // ----------------------------------------------------
      if (!isMobile && !prefersReducedMotion && heroRef.current) {
        const scrollTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5,
            onUpdate: (self) => {
              const p = self.progress;
              if (p > 0.05) {
                hasAnimatedRef.current = true;
              }
              if (aboutRevealRef.current) {
                aboutRevealRef.current.style.pointerEvents = p >= 0.85 ? 'auto' : 'none';
              }
              if (typographyRef.current) {
                typographyRef.current.style.pointerEvents = p <= 0.26 ? 'auto' : 'none';
              }
            },
          },
        });

        // Stage 1: Subtle camera push-in toward workstation (origin: 38% 74%)
        if (bgWrapRef.current) {
          scrollTimeline.to(
            bgWrapRef.current,
            {
              scale: 1.10,
              ease: 'power1.inOut',
              duration: 0.65,
            },
            0
          );
        }

        // Hero typography exits cleanly (completely invisible by 0.26)
        if (typographyRef.current) {
          scrollTimeline.to(
            typographyRef.current,
            {
              opacity: 0,
              y: -32,
              ease: 'power2.in',
              duration: 0.24,
            },
            0.02
          );
        }

        // Signature lockup fades out
        if (signatureRef.current) {
          scrollTimeline.to(
            signatureRef.current,
            {
              opacity: 0,
              ease: 'power2.in',
              duration: 0.20,
            },
            0.02
          );
        }

        // Stage 2: Restrained Workstation Glow (subtle warm highlight at desk)
        if (workstationGlowRef.current) {
          scrollTimeline.fromTo(
            workstationGlowRef.current,
            { opacity: 0, scale: 0.8 },
            { opacity: 0.45, scale: 1.15, ease: 'power2.out', duration: 0.22 },
            0.12
          );
          scrollTimeline.to(
            workstationGlowRef.current,
            { opacity: 0, ease: 'power2.in', duration: 0.24 },
            0.34
          );
        }

        // Stage 3: Narrow Cinematic Light Sweep traveling across the composition
        // Originates near workstation and sweeps across the screen
        if (lightSweepRef.current) {
          scrollTimeline.fromTo(
            lightSweepRef.current,
            {
              xPercent: -40,
            },
            {
              xPercent: 380,
              ease: 'power1.inOut',
              duration: 0.52,
            },
            0.18
          );

          // Sweep opacity: emerges, peaks at 0.68, and dissipates as it finishes crossing
          scrollTimeline.fromTo(
            lightSweepRef.current,
            { opacity: 0 },
            { opacity: 0.68, ease: 'power2.out', duration: 0.18 },
            0.18
          );
          scrollTimeline.to(
            lightSweepRef.current,
            { opacity: 0, ease: 'power2.in', duration: 0.20 },
            0.48
          );
        }

        // Stage 4: About Reveal Layer progressive directional reveal behind the light sweep
        if (aboutRevealRef.current) {
          scrollTimeline.fromTo(
            aboutRevealRef.current,
            {
              opacity: 0,
              clipPath: 'polygon(0 0, 0% 0, 0% 100%, 0 100%)',
            },
            {
              opacity: 1,
              clipPath: 'polygon(0 0, 140% 0, 120% 100%, 0 100%)',
              ease: 'power1.inOut',
              duration: 0.52,
            },
            0.18
          );
        }

        // Stage 5: About Scene Elements entrance choreography
        // Clean entry with generous clearance beneath sticky navigation
        scrollTimeline.fromTo(
          '.about-anim-tag',
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, ease: 'power2.out', duration: 0.24 },
          0.44
        );

        scrollTimeline.fromTo(
          '.about-anim-title',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, ease: 'power2.out', duration: 0.26 },
          0.48
        );

        scrollTimeline.fromTo(
          '.about-anim-mosaic',
          { y: 26, scale: 0.96, opacity: 0 },
          { y: 0, scale: 1.0, opacity: 1, ease: 'power2.out', duration: 0.30 },
          0.46
        );

        scrollTimeline.fromTo(
          '.about-anim-text',
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, ease: 'power2.out', duration: 0.26 },
          0.56
        );

        scrollTimeline.fromTo(
          '.about-anim-btn',
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, ease: 'power2.out', duration: 0.22 },
          0.66
        );
      }
    }, heroRef);

    return () => {
      ctx.revert();
    };
  }, [prefersReducedMotion]);

  // Gentle Mouse Parallax (direct DOM manipulation, 0 React re-renders)
  useEffect(() => {
    if (prefersReducedMotion) return;
    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 960);
    if (isTouch) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rAFId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX / innerWidth - 0.5) * 2;
      targetY = (e.clientY / innerHeight - 0.5) * 2;
    };

    const loop = () => {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      if (bgInnerRef.current) {
        bgInnerRef.current.style.transform = `translate3d(${(currentX * 6).toFixed(2)}px, ${(currentY * 4).toFixed(2)}px, 0)`;
      }
      rAFId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rAFId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rAFId);
    };
  }, [prefersReducedMotion]);

  return (
    <section
      ref={heroRef}
      id="home"
      className="scene-section scene-hero-cinematic"
      aria-labelledby="hero-title"
    >
      {/* ========================================================
          STICKY STAGE VIEWPORT (Desktop 100vh Sticky Stage)
          ======================================================== */}
      <div className="hero-sticky-frame">
        {/* ========================================================
            UNIFIED CINEMATIC PHOTOGRAPHIC SCENE (Desktop Full-Bleed)
            ======================================================== */}
        <div
          ref={bgWrapRef}
          className="hero-cinematic-bg-wrap"
          style={{ transformOrigin: '38% 74%' }}
          aria-hidden="true"
        >
          <div ref={bgInnerRef} className="hero-cinematic-bg-inner">
            <Image
              src="/images/philozz-cinematic-hero.png"
              alt="Felopater Nabil — Full-Stack Software Engineer seated at executive desk"
              fill
              priority
              quality={100}
              sizes="(max-width: 960px) 1px, 100vw"
              className="hero-cinematic-bg-img"
            />

            {/* Soft Left Negative-Space Vignette */}
            <div className="hero-cinematic-left-vignette" />

            {/* Subtle Top & Bottom Edge Blends */}
            <div className="hero-cinematic-top-vignette" />
            <div className="hero-cinematic-bottom-vignette" />

            {/* Editorial Signature & Brand Credentials Lockup */}
            <div ref={signatureRef} className="hero-signature-lockup">
              <div className="hero-signature-script">
                <span className="sig-word">Code</span>
                <span className="sig-word">Build</span>
                <span className="sig-word">Improve</span>
                <span className="sig-word">Repeat</span>
              </div>

              <div className="hero-signature-credentials">
                <span className="sig-brand">PHILOZZ</span>
                <span className="sig-divider" />
                <span className="sig-item">CLEAN CODE</span>
                <span className="sig-item">SCALABLE SYSTEMS</span>
                <span className="sig-item">REAL IMPACT</span>
                <span className="sig-divider" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            RESTRAINED WORKSTATION GLOW
            Subtle warm golden highlight localized to the desk
            ======================================================== */}
        <div
          ref={workstationGlowRef}
          className="hero-workstation-glow"
          aria-hidden="true"
        />

        {/* ========================================================
            CINEMATIC LIGHT SWEEP
            Narrow, soft-edged anamorphic golden beam traveling across
            ======================================================== */}
        <div
          ref={lightSweepRef}
          className="hero-cinematic-light-sweep"
          aria-hidden="true"
        />

        {/* ========================================================
            ABOUT SCENE REVEAL LAYER
            Soft radial aperture expanding from the workstation
            ======================================================== */}
        <div ref={aboutRevealRef} className="hero-about-reveal-layer">
          <AboutScene isTransitionStage={true} />
        </div>

        {/* ========================================================
            HTML EDITORIAL TYPOGRAPHY & INTERACTIVE CONTROLS
            ======================================================== */}
        <div ref={typographyRef} className="hero-typography-layer">
          <div className="container-editorial" style={{ maxWidth: '1440px' }}>
            <div className="hero-editorial-wrapper">
              {/* Small Eyebrow Tag */}
              <div ref={eyebrowRef} className="hero-eyebrow-tag">
                <Terminal size={14} style={{ color: 'var(--color-gold-light)' }} />
                <span>FULL-STACK DEVELOPER</span>
              </div>

              {/* Main Editorial Headline */}
              <h1 id="hero-title" className="hero-editorial-title">
                <span className="title-line title-white">Full-Stack</span>
                <span className="title-line title-white">Engineer.</span>
                <span className="title-line title-gold">Backend at Heart.</span>
              </h1>

              {/* Mobile Cinematic Visual Frame: Visible only on mobile viewports */}
              <div ref={mobileFrameRef} className="hero-mobile-visual-frame" aria-hidden="true">
                <Image
                  src="/images/philozz-cinematic-hero.png"
                  alt="Felopater Nabil seated at executive desk with laptop"
                  fill
                  priority
                  quality={100}
                  sizes="(min-width: 961px) 1px, (max-width: 480px) 100vw, 460px"
                  className="hero-mobile-visual-img"
                />
                <div className="hero-mobile-visual-fade" />
              </div>

              {/* Supporting Editorial Description */}
              <p ref={descRef} className="hero-editorial-description">
                Building performant, scalable, and meaningful web applications.
                I turn ideas into robust backend systems and delightful digital experiences.
              </p>

              {/* Interactive Primary & Secondary CTA Buttons */}
              <div ref={ctaGroupRef} className="hero-editorial-cta-group">
                <a
                  href="#projects"
                  className="btn-gold hero-btn-primary"
                  aria-label="View My Selected Engineering Work"
                >
                  <span>View My Work</span>
                  <ArrowRight size={18} />
                </a>

                <a
                  href="#contact"
                  className="btn-outline-gold hero-btn-secondary"
                  aria-label="Let's Talk — Contact Felopater Nabil"
                >
                  <MessageSquare size={16} style={{ color: 'var(--color-gold-light)' }} />
                  <span>Let&apos;s Talk</span>
                </a>
              </div>

              {/* Verified Metrics Counter Row */}
              <div ref={metricsRowRef} className="hero-editorial-metrics-row" aria-label="Key Professional Metrics">
                <div className="metric-box">
                  <div className="metric-num">{BRAND_INFO.experienceYears}</div>
                  <div className="metric-lbl">Years Experience</div>
                </div>

                <div className="metric-separator" aria-hidden="true" />

                <div className="metric-box">
                  <div className="metric-num">{BRAND_INFO.projectsCount}</div>
                  <div className="metric-lbl">Projects Completed</div>
                </div>

                <div className="metric-separator" aria-hidden="true" />

                <div className="metric-box">
                  <div className="metric-num metric-curiosity">
                    <span>{BRAND_INFO.curiosity}</span>
                  </div>
                  <div className="metric-lbl">Curiosity To Build More</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Flow: render AboutScene directly when on mobile viewports */}
      <div className="hero-mobile-about-section">
        <AboutScene />
      </div>

      {/* Anchor for nav link #about: positioned at transition completion */}
      <div
        id="about"
        style={{
          position: 'absolute',
          top: '100vh',
          height: '1px',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
    </section>
  );
}
