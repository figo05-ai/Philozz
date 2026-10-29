import React, { useRef } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { PROJECTS, COMPACT_PROJECT_META } from '@/data/portfolioData';
import { ProjectEntity } from '@/cms/models/project';
import { ProjectSchematicVisual } from '@/components/ProjectSchematicVisual';
import { SkillsToProjectsTransition } from '@/components/SkillsToProjectsTransition';

export interface ProjectsSceneProps {
  featuredProjects?: ProjectEntity[];
}

export function ProjectsScene({ featuredProjects: propsProjects }: ProjectsSceneProps = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const galleryGridRef = useRef<HTMLDivElement>(null);

  // Exactly 3 approved featured projects: use CMS projects if provided, otherwise fallback to PROJECTS.slice(0, 3)
  const featuredProjects =
    propsProjects && propsProjects.length > 0 ? propsProjects.slice(0, 3) : PROJECTS.slice(0, 3);

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
          {/* Cinematic Transition Bridge: Skills -> Projects ("GALAXY COLLAPSE — PROJECT REVEAL") */}
          <SkillsToProjectsTransition />

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
                    aria-label={`Explore Case Study: ${project.title}`}
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

        {/* View All Projects Action Link — Navigates to dedicated /projects archive */}
        <div className="projects-toggle-wrapper">
          <Link
            href="/projects"
            className="btn-outline-gold projects-toggle-btn"
            aria-label={`View All Verified Projects (${PROJECTS.length}) — Open full archive`}
          >
            <Sparkles size={16} style={{ color: 'var(--color-gold)' }} />
            <span>View All Verified Projects ({PROJECTS.length})</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
