'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Terminal,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROJECTS } from '@/data/portfolioData';
import { ProjectSchematicVisual } from '@/components/ProjectSchematicVisual';

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

// Curated concise descriptions & primary tech tags for compact gallery presentation
const COMPACT_PROJECT_META: Record<
  string,
  { shortSummary: string; primaryTechs: string[]; categoryLabel: string }
> = {
  'skillup-platform': {
    categoryLabel: 'HIGH-CONCURRENCY ARCHITECTURE',
    shortSummary:
      'High-throughput backend infrastructure engineered for burst traffic spikes, utilizing Redis caching and Horizon queue workers with sub-50ms latency.',
    primaryTechs: ['Laravel', 'Redis Cluster', 'MySQL 8'],
  },
  'smartpos-erp': {
    categoryLabel: 'DESKTOP RUNTIME & HARDWARE I/O',
    shortSummary:
      'Cross-platform retail POS built with NativePHP, featuring real-time barcode/IMEI hardware scanning, instant checkout, and offline-resilient sync.',
    primaryTechs: ['Laravel', 'NativePHP', 'MySQL 8'],
  },
  'tanqia-skills': {
    categoryLabel: 'WORKFLOW AUTOMATION & QUEUES',
    shortSummary:
      'Enterprise task delegation platform with role-based access control, automated bulk Excel ingestion with bounded memory, and advisory mutex locks.',
    primaryTechs: ['Laravel', 'Tailwind CSS', 'MySQL 8'],
  },
  'sip-and-snug': {
    categoryLabel: 'E-COMMERCE & OPENAPI SERVICES',
    shortSummary:
      'Token-authenticated RESTful backend powering web and mobile clients with dynamic cart reservations, delivery zones, and OpenAPI 3.0 contracts.',
    primaryTechs: ['Laravel 13', 'Sanctum', 'OpenAPI 3.0'],
  },
  'academy-lms': {
    categoryLabel: 'EDUCATION TECHNOLOGY & SECURITY',
    shortSummary:
      'Secure learning platform utilizing the Services Design Pattern, sequential course progression, strict CSP headers, and certificate verification.',
    primaryTechs: ['Laravel 13', 'Docker', 'CSP Headers'],
  },
  'clothes-ecommerce': {
    categoryLabel: 'FINANCIAL MODULES & RMA',
    shortSummary:
      'Enterprise fashion e-commerce backend featuring double-entry digital wallet accounting, customer loyalty rewards, and Filament administration.',
    primaryTechs: ['Laravel 13', 'Filament v3', 'TALL Stack'],
  },
};

export function ProjectsScene() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );

  const [showAll, setShowAll] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const galleryGridRef = useRef<HTMLDivElement>(null);

  // Top 3 featured projects for the primary horizontal row
  const featuredProjects = PROJECTS.slice(0, 3);
  // Additional verified projects revealed upon toggle
  const additionalProjects = PROJECTS.slice(3);

  // GSAP Reveal for Additional Verified Projects when expanded
  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion || !showAll) return;

    const ctx = gsap.context(() => {
      const additionalCards = gsap.utils.toArray<HTMLElement>(
        '.additional-gallery-row .gallery-project-card'
      );

      if (additionalCards.length > 0) {
        gsap.fromTo(
          additionalCards,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.1,
            ease: 'power2.out',
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion, showAll]);

  return (
    <section
      ref={containerRef}
      id="projects"
      className="scene-section scene-projects"
      aria-labelledby="projects-title"
    >
      <div className="container-editorial">
        {/* Section Header */}
        <div className="projects-header-wrapper">
          <div className="section-tag">
            <Terminal size={14} style={{ color: 'var(--color-gold)' }} />
            <span>FEATURED PROJECTS // PRODUCTION ARCHITECTURE</span>
          </div>

          <h2 id="projects-title" className="font-editorial-large projects-editorial-heading">
            Engineering Case Studies.{' '}
            <span className="font-gold-gradient">Built for Scale.</span>
          </h2>

          <p className="projects-editorial-description">
            A curated selection of high-concurrency platforms, desktop hardware runtimes,
            and distributed queue systems engineered with PHP, Laravel, Redis, and MySQL.
          </p>
        </div>

        {/* ========================================================
            THREE-COLUMN HORIZONTAL FEATURED PROJECTS GALLERY
            At >= 1280px: All 3 cards appear in ONE horizontal row
            ======================================================== */}
        <div className="projects-gallery-wrapper">
          <div ref={galleryGridRef} className="projects-horizontal-gallery">
          {featuredProjects.map((project, idx) => {
            const meta = COMPACT_PROJECT_META[project.slug] || {
              categoryLabel: project.category.toUpperCase(),
              shortSummary: project.summary,
              primaryTechs: project.technologies.slice(0, 3),
            };

            return (
              <article
                key={project.slug}
                className="gallery-project-card"
                data-project-index={idx + 1}
              >
                {/* Visual Preview Header (Compact Architectural Diagram) */}
                <div className="gallery-card-visual">
                  <ProjectSchematicVisual
                    type={project.demoVisualType}
                    slug={project.slug}
                    variant="compact"
                  />
                </div>

                {/* Card Editorial Content */}
                <div className="gallery-card-body">
                  {/* Category & Project Index */}
                  <div className="gallery-card-meta">
                    <span className="gallery-index-tag">0{idx + 1}</span>
                    <span className="gallery-meta-divider">/</span>
                    <span className="gallery-category-label">{meta.categoryLabel}</span>
                  </div>

                  {/* Project Title */}
                  <h3 className="gallery-project-title">
                    <Link href={`/work/${project.slug}`} className="gallery-title-link">
                      {project.title}
                    </Link>
                  </h3>

                  {/* Short Description (Max 2-3 lines) */}
                  <p className="gallery-project-summary">{meta.shortSummary}</p>

                  {/* Primary Technology Labels */}
                  <div className="gallery-tech-pills">
                    {meta.primaryTechs.map((tech) => (
                      <span key={tech} className="badge-tech gallery-tech-badge">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="gallery-card-footer">
                  <Link
                    href={`/work/${project.slug}`}
                    className="btn-gold gallery-explore-btn"
                    aria-label={`Explore architectural case study for ${project.title}`}
                  >
                    <span>Explore Case Study</span>
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>

        {/* ========================================================
            ADDITIONAL VERIFIED PROJECTS (Expanded on Toggle)
            ======================================================== */}
        {showAll && (
          <div className="projects-horizontal-gallery additional-gallery-row">
            {additionalProjects.map((project, extraIdx) => {
              const actualIdx = 3 + extraIdx;
              const meta = COMPACT_PROJECT_META[project.slug] || {
                categoryLabel: project.category.toUpperCase(),
                shortSummary: project.summary,
                primaryTechs: project.technologies.slice(0, 3),
              };

              return (
                <article
                  key={project.slug}
                  className="gallery-project-card"
                  data-project-index={actualIdx + 1}
                >
                  <div className="gallery-card-visual">
                    <ProjectSchematicVisual
                      type={project.demoVisualType}
                      slug={project.slug}
                      variant="compact"
                    />
                  </div>

                  <div className="gallery-card-body">
                    <div className="gallery-card-meta">
                      <span className="gallery-index-tag">0{actualIdx + 1}</span>
                      <span className="gallery-meta-divider">/</span>
                      <span className="gallery-category-label">{meta.categoryLabel}</span>
                    </div>

                    <h3 className="gallery-project-title">
                      <Link href={`/work/${project.slug}`} className="gallery-title-link">
                        {project.title}
                      </Link>
                    </h3>

                    <p className="gallery-project-summary">{meta.shortSummary}</p>

                    <div className="gallery-tech-pills">
                      {meta.primaryTechs.map((tech) => (
                        <span key={tech} className="badge-tech gallery-tech-badge">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="gallery-card-footer">
                    <Link
                      href={`/work/${project.slug}`}
                      className="btn-gold gallery-explore-btn"
                      aria-label={`Explore architectural case study for ${project.title}`}
                    >
                      <span>Explore Case Study</span>
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* View All Projects Action Toggle */}
        {additionalProjects.length > 0 && (
          <div className="projects-toggle-wrapper">
            <button
              type="button"
              className="btn-outline-gold projects-toggle-btn"
              onClick={() => setShowAll(!showAll)}
              aria-label={
                showAll ? 'Show fewer featured projects' : 'View all verified production projects'
              }
            >
              <Sparkles size={16} style={{ color: 'var(--color-gold)' }} />
              <span>
                {showAll ? 'Show Fewer Projects' : `View All Verified Projects (${PROJECTS.length})`}
              </span>
              {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
