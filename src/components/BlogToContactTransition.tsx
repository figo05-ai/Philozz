'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles } from 'lucide-react';

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

export function BlogToContactTransition() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );

  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lineWrapRef = useRef<HTMLDivElement>(null);
  const lineBarRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) return;

    const blogSection = document.getElementById('blog');
    const contactSection = document.getElementById('contact');
    if (!blogSection || !contactSection) return;

    const ctx = gsap.context(() => {
      // Select Blog elements for pullback & fade
      const blogHeaderWrapper = document.querySelector<HTMLElement>('.notes-header-wrapper');
      const blogFeatured = document.querySelector<HTMLElement>('.journal-featured-wrapper');
      const blogSecondary = document.querySelector<HTMLElement>('.journal-secondary-grid');
      const blogToggle = document.querySelector<HTMLElement>('.journal-toggle-wrapper');
      const blogArticles = gsap.utils.toArray<HTMLElement>('.journal-article-card');

      const blogElements = [
        blogFeatured,
        blogSecondary,
        blogToggle,
      ].filter(Boolean) as HTMLElement[];

      // Select Contact elements for staggered reveal
      const contactEyebrow = document.querySelector<HTMLElement>('.contact-header-tag');
      const contactHeading = document.querySelector<HTMLElement>('.contact-main-heading');
      const contactDesc = document.querySelector<HTMLElement>('.contact-desc');
      const contactCtas = document.querySelector<HTMLElement>('.contact-cta-group');
      const contactChannels = document.querySelector<HTMLElement>('.contact-channels-group');
      const contactPortrait = document.querySelector<HTMLElement>('.contact-portrait-group');

      const contactElements = [
        contactEyebrow,
        contactHeading,
        contactDesc,
        contactCtas,
        contactChannels,
        contactPortrait,
      ].filter(Boolean) as HTMLElement[];

      // Initial overlay states
      if (overlayRef.current) {
        gsap.set(overlayRef.current, { display: 'none', opacity: 1 });
      }
      if (backdropRef.current) {
        gsap.set(backdropRef.current, { opacity: 0 });
      }
      if (contentRef.current) {
        gsap.set(contentRef.current, { opacity: 0, y: 24 });
      }
      if (lineWrapRef.current) {
        gsap.set(lineWrapRef.current, { opacity: 0, y: 0, scaleX: 1.0 });
      }
      if (lineBarRef.current) {
        gsap.set(lineBarRef.current, { scaleX: 0 });
      }
      if (cursorRef.current) {
        gsap.set(cursorRef.current, { opacity: 0, left: '0%' });
      }

      // Dedicated ScrollTrigger Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'blog-to-contact',
          trigger: contactSection,
          start: 'top bottom',
          end: 'top top',
          scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress;

            // Overlay active strictly during Final Commit stage (0.08 to 0.58)
            // Hides completely before Contact becomes the dominant scene
            if (overlayRef.current) {
              if (p >= 0.08 && p <= 0.58) {
                overlayRef.current.style.display = 'block';
                overlayRef.current.style.pointerEvents = 'none';
              } else {
                overlayRef.current.style.display = 'none';
              }
            }
          },
          onLeave: () => {
            // Stage 05: Contact Resting — restore clean native props on Contact elements
            if (contactElements.length > 0) {
              gsap.set(contactElements, { clearProps: 'opacity,transform,visibility' });
            }
            if (overlayRef.current) {
              overlayRef.current.style.display = 'none';
            }
          },
          onLeaveBack: () => {
            // Reverse Back to 0%: Blog Resting — restore clean native props on Blog elements
            if (blogElements.length > 0) {
              gsap.set(blogElements, { clearProps: 'opacity,transform,visibility' });
            }
            if (blogHeaderWrapper) {
              gsap.set(blogHeaderWrapper, { clearProps: 'opacity,transform,visibility' });
            }
            if (blogArticles.length > 0) {
              gsap.set(blogArticles, { clearProps: 'opacity,transform,visibility' });
            }
            if (contactElements.length > 0) {
              gsap.set(contactElements, { clearProps: 'opacity,transform,visibility' });
            }
            if (overlayRef.current) {
              overlayRef.current.style.display = 'none';
            }
          },
        },
      });

      // ========================================================
      // STAGE 01 — ENGINEERING JOURNAL PULLBACK (0.00 - 0.20)
      // Articles remain readable at start, then gently scale down and
      // recede in 3D perspective as the visitor approaches bottom.
      // ========================================================
      if (blogElements.length > 0) {
        tl.to(
          blogElements,
          {
            y: -24,
            scale: 0.96,
            opacity: 0.55,
            duration: 0.20,
            ease: 'power1.out',
          },
          0.00
        );

        // Complete fading of Blog elements by 0.35
        tl.to(
          blogElements,
          {
            opacity: 0,
            duration: 0.15,
            ease: 'power1.in',
          },
          0.20
        );
      }

      // ========================================================
      // STAGE 02 — THE LAST LINE (0.16 - 0.44)
      // Backdrop materializes with soft ambient vignette.
      // Editorial thought composition fades in.
      // The warm-gold line draws smoothly from left to right.
      // Golden cursor accent tracks the drawing head.
      // ========================================================
      if (backdropRef.current) {
        tl.fromTo(
          backdropRef.current,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.14,
            ease: 'power2.inOut',
          },
          0.14
        );
      }

      if (contentRef.current) {
        tl.fromTo(
          contentRef.current,
          { opacity: 0, y: 20, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1.0,
            duration: 0.14,
            ease: 'power2.out',
          },
          0.18
        );
      }

      if (lineWrapRef.current) {
        tl.fromTo(
          lineWrapRef.current,
          { opacity: 0, y: 0, scaleX: 1.0 },
          {
            opacity: 1,
            y: 0,
            scaleX: 1.0,
            duration: 0.06,
            ease: 'power1.out',
          },
          0.20
        );
      }

      if (lineBarRef.current) {
        tl.fromTo(
          lineBarRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.20,
            ease: 'power1.inOut',
          },
          0.22
        );
      }

      if (cursorRef.current) {
        tl.fromTo(
          cursorRef.current,
          { opacity: 0, left: '0%' },
          {
            opacity: 1,
            left: '100%',
            duration: 0.20,
            ease: 'power1.inOut',
          },
          0.22
        );
      }

      // ========================================================
      // STAGE 03 — DISSOLVE BEFORE CONTACT (0.42 - 0.56)
      // 1. Line finishes drawing at 0.42.
      // 2. Cursor softly pulses out (0.42 - 0.46).
      // 3. Editorial title softly dissolves (0.44 - 0.53).
      // 4. Golden line contracts & dissolves softly in place (0.44 - 0.53).
      //    Line NEVER translates down across Contact content!
      // 5. Backdrop dissolves completely (0.42 - 0.56), lifting any darkness.
      // ========================================================
      if (cursorRef.current) {
        tl.to(
          cursorRef.current,
          {
            opacity: 0,
            scale: 1.4,
            duration: 0.04,
            ease: 'power2.out',
          },
          0.42
        );
      }

      if (contentRef.current) {
        tl.to(
          contentRef.current,
          {
            opacity: 0,
            y: -14,
            scale: 1.01,
            duration: 0.09,
            ease: 'power2.in',
          },
          0.44
        );
      }

      if (lineWrapRef.current) {
        tl.to(
          lineWrapRef.current,
          {
            opacity: 0,
            scaleX: 0.82,
            y: -8,
            duration: 0.09,
            ease: 'power2.in',
          },
          0.44
        );
      }

      if (backdropRef.current) {
        tl.to(
          backdropRef.current,
          {
            opacity: 0,
            duration: 0.14,
            ease: 'power2.out',
          },
          0.42
        );
      }

      // ========================================================
      // STAGE 04 — CONTACT PROGRESSIVE ILLUMINATION (0.46 - 0.76)
      // Contact elements illuminate in natural, bright, and legible progression:
      // Eyebrow -> Main Heading -> Description & Portrait -> CTAs -> Channels.
      // Zero overlay darkness covering Contact, zero line overlap!
      // ========================================================
      if (contactEyebrow) {
        tl.fromTo(
          contactEyebrow,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.14,
            ease: 'power2.out',
          },
          0.46
        );
      }

      if (contactHeading) {
        tl.fromTo(
          contactHeading,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.14,
            ease: 'power2.out',
          },
          0.50
        );
      }

      if (contactDesc) {
        tl.fromTo(
          contactDesc,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.14,
            ease: 'power2.out',
          },
          0.54
        );
      }

      if (contactPortrait) {
        tl.fromTo(
          contactPortrait,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.16,
            ease: 'power2.out',
          },
          0.54
        );
      }

      if (contactCtas) {
        tl.fromTo(
          contactCtas,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.14,
            ease: 'power2.out',
          },
          0.58
        );
      }

      if (contactChannels) {
        tl.fromTo(
          contactChannels,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.14,
            ease: 'power2.out',
          },
          0.62
        );
      }

      // ========================================================
      // STAGE 05 — CONTACT RESTING (0.76 - 1.00)
      // Contact section is 100% visible, settled, and interactive.
      // Overlays are completely hidden with pointer-events: none.
      // ========================================================
      tl.to({}, { duration: 0.001 }, 1.0);
    });

    const handleResize = () => {
      ScrollTrigger.getById('blog-to-contact')?.refresh();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      ctx.revert();
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="final-commit-overlay"
      aria-hidden="true"
      style={{ display: 'none' }}
    >
      {/* Soft Ambient Vignette Backdrop */}
      <div ref={backdropRef} className="final-commit-backdrop" />

      {/* Center Stage Presentation Container */}
      <div className="final-commit-stage">
        {/* Editorial Manuscript Closing Thought */}
        <div ref={contentRef} className="final-commit-content">
          <div className="final-commit-eyebrow">
            <Sparkles size={13} className="text-gold" />
            <span>THE FINAL COMMIT // FROM KNOWLEDGE TO CONNECTION</span>
          </div>

          <h3 className="final-commit-heading">
            From Architecture <span className="font-gold-gradient">to Conversation.</span>
          </h3>

          <p className="final-commit-sub">
            Every system is built in code. Every impactful journey begins with a conversation.
          </p>
        </div>

        {/* The Golden Line Motif with Dynamic Cursor Accent */}
        <div ref={lineWrapRef} className="final-commit-line-wrap">
          <div className="final-commit-line-track">
            <div ref={lineBarRef} className="final-commit-line-bar" />
          </div>

          {/* Golden Cursor-Like Accent */}
          <div ref={cursorRef} className="final-commit-cursor" />
        </div>
      </div>
    </div>
  );
}
