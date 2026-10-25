'use client';

import React, { useState, useMemo, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Search,
  X,
  Terminal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import {
  PROJECTS,
  COMPACT_PROJECT_META,
  ARCHIVE_CATEGORIES,
  BRAND_INFO,
} from '@/data/portfolioData';
import { ProjectSchematicVisual } from '@/components/ProjectSchematicVisual';

export function ProjectsArchiveView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Read initial filter values from URL search params
  const paramQ = searchParams?.get('q') || '';
  const paramCategory = searchParams?.get('category') || 'all';
  const paramPage = parseInt(searchParams?.get('page') || '1', 10);
  const paramSize = parseInt(searchParams?.get('size') || searchParams?.get('limit') || '9', 10);

  const [searchQuery, setSearchQuery] = useState(paramQ);
  const [prevParamQ, setPrevParamQ] = useState(paramQ);

  // Sync input text with URL if paramQ changes externally (e.g. Back/Forward)
  if (paramQ !== prevParamQ) {
    setPrevParamQ(paramQ);
    setSearchQuery(paramQ);
  }

  const selectedCategory = paramCategory;
  const currentPage = isNaN(paramPage) || paramPage < 1 ? 1 : paramPage;
  const pageSize = isNaN(paramSize) || paramSize < 1 ? 9 : paramSize;

  // Synchronize URL with active filters
  const updateUrl = useCallback(
    (newQ: string, newCat: string, newPage: number) => {
      const params = new URLSearchParams();
      if (newQ.trim()) params.set('q', newQ.trim());
      if (newCat && newCat !== 'all') params.set('category', newCat);
      if (newPage > 1) params.set('page', newPage.toString());
      if (pageSize !== 9) params.set('size', pageSize.toString());

      const queryStr = params.toString();
      const newPath = queryStr ? `/projects?${queryStr}` : '/projects';

      startTransition(() => {
        router.replace(newPath, { scroll: false });
      });
    },
    [router, pageSize]
  );

  // Category counts based on total verified projects
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: PROJECTS.length };
    ARCHIVE_CATEGORIES.forEach((cat) => {
      if (cat.id !== 'all') {
        counts[cat.id] = PROJECTS.filter(
          (p) => COMPACT_PROJECT_META[p.slug]?.archiveCategory === cat.id
        ).length;
      }
    });
    return counts;
  }, []);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return PROJECTS.filter((project) => {
      const meta = COMPACT_PROJECT_META[project.slug];

      // Category filter check
      if (selectedCategory !== 'all') {
        if (meta?.archiveCategory !== selectedCategory) {
          return false;
        }
      }

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = project.title.toLowerCase().includes(q);
        const summaryMatch =
          project.summary.toLowerCase().includes(q) ||
          meta?.shortSummary.toLowerCase().includes(q);
        const techMatch =
          project.technologies.some((t) => t.toLowerCase().includes(q)) ||
          meta?.primaryTechs.some((t) => t.toLowerCase().includes(q));
        const categoryMatch =
          project.category.toLowerCase().includes(q) ||
          meta?.categoryLabel.toLowerCase().includes(q);
        const roleMatch = project.role.toLowerCase().includes(q);

        return titleMatch || summaryMatch || techMatch || categoryMatch || roleMatch;
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProjects = useMemo(() => {
    const startIndex = (validPage - 1) * pageSize;
    return filteredProjects.slice(startIndex, startIndex + pageSize);
  }, [filteredProjects, validPage, pageSize]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    updateUrl(val, selectedCategory, 1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    updateUrl('', selectedCategory, 1);
  };

  const handleCategorySelect = (categoryId: string) => {
    updateUrl(searchQuery, categoryId, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateUrl(searchQuery, selectedCategory, newPage);
      // Smoothly scroll to top of gallery controls when changing pages
      const controlsElem = document.getElementById('archive-controls');
      if (controlsElem) {
        controlsElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    updateUrl('', 'all', 1);
  };

  const isFiltered = searchQuery.trim().length > 0 || selectedCategory !== 'all';

  return (
    <div className="archive-page-wrap">
      {/* Sticky Top Header Navigation */}
      <header className="archive-top-header" role="banner">
        <div className="container-editorial archive-top-nav-inner">
          <Link
            href="/#projects"
            className="archive-back-link"
            aria-label="Return to portfolio homepage projects section"
          >
            <ArrowLeft size={16} />
            <span>BACK TO PORTFOLIO</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" className="archive-brand-tag">
              {BRAND_INFO.name} {'//'} {BRAND_INFO.developerName}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Archive Content Stream */}
      <main id="main-content" style={{ flex: '1 0 auto' }}>
        {/* Editorial Hero Intro */}
        <section className="archive-hero-wrap" aria-labelledby="archive-title">
          <div className="container-editorial">
            <div className="section-tag archive-heading-eyebrow">
              <Terminal size={14} style={{ color: 'var(--color-gold)' }} />
              <span>PHILOZZ // PROJECT ARCHIVE</span>
            </div>

            <h1 id="archive-title" className="archive-heading-main font-editorial-large">
              Engineering Work.{' '}
              <span className="font-gold-gradient">Built with Purpose.</span>
            </h1>

            <p className="archive-heading-desc">
              A collection of software systems, backend architectures, and digital products
              I&apos;ve worked on.
            </p>

            {/* Search & Category Filter Controls */}
            <div id="archive-controls" className="archive-controls-bar">
              {/* Search Box */}
              <div className="archive-search-box">
                <Search size={18} className="archive-search-icon" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search projects by title, tech stack, or architecture..."
                  className="archive-search-input"
                  aria-label="Search projects by title, tech stack, or architecture"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="archive-search-clear"
                    aria-label="Clear search input"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div
                className="archive-filters-row"
                role="tablist"
                aria-label="Filter projects by category"
              >
                {ARCHIVE_CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat.id] || 0;
                  const isActive = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`archive-filter-pill ${isActive ? 'active' : ''}`}
                    >
                      <span>{cat.label}</span>
                      <span className="archive-filter-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Metadata Bar */}
            <div className="archive-meta-bar">
              <div className="archive-meta-count">
                <span className="archive-meta-dot" aria-hidden="true" />
                <span>
                  Showing {filteredProjects.length === 0 ? 0 : (validPage - 1) * pageSize + 1}–
                  {Math.min(validPage * pageSize, filteredProjects.length)} of{' '}
                  {filteredProjects.length} verified{' '}
                  {filteredProjects.length === 1 ? 'project' : 'projects'}
                  {isFiltered && ` (Filtered from ${PROJECTS.length} total)`}
                </span>
              </div>

              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="archive-back-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <RotateCcw size={14} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* ========================================================
                RESPONSIVE PROJECT GALLERY GRID
                3 columns desktop (>= 1280px), 2 columns tablet, 1 column mobile
                ======================================================== */}
            {filteredProjects.length > 0 ? (
              <div className="archive-grid">
                {paginatedProjects.map((project, idx) => {
                  const overallIndex = (validPage - 1) * pageSize + idx + 1;
                  const formattedIndex = overallIndex < 10 ? `0${overallIndex}` : `${overallIndex}`;
                  const meta = COMPACT_PROJECT_META[project.slug] || {
                    categoryLabel: project.category.toUpperCase(),
                    shortSummary: project.summary,
                    primaryTechs: project.technologies.slice(0, 3),
                  };

                  return (
                    <article
                      key={project.slug}
                      className="gallery-project-card"
                      data-project-index={overallIndex}
                    >
                      {/* Compact Architecture Schematic Preview */}
                      <div className="gallery-card-visual">
                        <ProjectSchematicVisual
                          type={project.demoVisualType}
                          slug={project.slug}
                          variant="compact"
                        />
                      </div>

                      {/* Card Body */}
                      <div className="gallery-card-body">
                        {/* Index & Category */}
                        <div className="gallery-card-meta">
                          <span className="gallery-index-tag">{formattedIndex}</span>
                          <span className="gallery-meta-divider">/</span>
                          <span className="gallery-category-label">{meta.categoryLabel}</span>
                        </div>

                        {/* Title */}
                        <h2 className="gallery-project-title" style={{ fontSize: '1.28rem' }}>
                          <Link href={`/work/${project.slug}`} className="gallery-title-link">
                            {project.title}
                          </Link>
                        </h2>

                        {/* Summary */}
                        <p className="gallery-project-summary">{meta.shortSummary}</p>

                        {/* Primary Technologies */}
                        <div className="gallery-tech-pills">
                          {meta.primaryTechs.map((tech) => (
                            <span key={tech} className="badge-tech gallery-tech-badge">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Link */}
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
            ) : (
              /* Empty Results State */
              <div className="archive-empty-state">
                <div className="archive-empty-icon">
                  <SlidersHorizontal size={24} />
                </div>
                <h3 className="archive-empty-title">No matching projects found</h3>
                <p className="archive-empty-desc">
                  No verified projects matched your criteria{' '}
                  {searchQuery ? `"${searchQuery}"` : ''} in the{' '}
                  {selectedCategory !== 'all'
                    ? ARCHIVE_CATEGORIES.find((c) => c.id === selectedCategory)?.label
                    : ''}{' '}
                  category.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="archive-reset-btn"
                >
                  <RotateCcw size={16} />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}

            {/* ========================================================
                PAGINATION CONTROLS (Only visible when totalPages > 1)
                ======================================================== */}
            {totalPages > 1 && (
              <nav
                className="archive-pagination-wrap"
                aria-label="Project archive pages navigation"
              >
                <button
                  type="button"
                  onClick={() => handlePageChange(validPage - 1)}
                  disabled={validPage <= 1}
                  className="archive-page-btn"
                  aria-label="Go to previous page"
                >
                  <ChevronLeft size={16} />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`archive-page-num ${validPage === pageNum ? 'active' : ''}`}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={validPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(validPage + 1)}
                  disabled={validPage >= totalPages}
                  className="archive-page-btn"
                  aria-label="Go to next page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </nav>
            )}
          </div>
        </section>
      </main>

      {/* Editorial Footer */}
      <footer className="archive-footer-wrap" role="contentinfo">
        <div className="container-editorial archive-footer-inner">
          <div>
            <span>
              © {new Date().getFullYear()} {BRAND_INFO.developerName}. All rights reserved.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link href="/#projects" className="archive-footer-link">
              <span>Return to Portfolio</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
