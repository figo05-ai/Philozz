'use client';

import React, { useState, useMemo, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Search,
  X,
  BookOpen,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  NOTES,
  BLOG_CATEGORIES,
  BRAND_INFO,
} from '@/data/portfolioData';
import { BlogCardVisual } from '@/components/JournalVisuals';

export function BlogArchiveView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Read initial filter values from URL search params
  const paramQ = searchParams?.get('q') || '';
  const paramCategory = searchParams?.get('category') || 'all';
  const paramPage = parseInt(searchParams?.get('page') || '1', 10);
  const paramSize = parseInt(searchParams?.get('size') || searchParams?.get('limit') || '6', 10);

  const [searchQuery, setSearchQuery] = useState(paramQ);
  const [prevParamQ, setPrevParamQ] = useState(paramQ);

  // Sync input text with URL if paramQ changes externally (e.g. Back/Forward)
  if (paramQ !== prevParamQ) {
    setPrevParamQ(paramQ);
    setSearchQuery(paramQ);
  }

  const selectedCategory = paramCategory;
  const currentPage = isNaN(paramPage) || paramPage < 1 ? 1 : paramPage;
  const pageSize = isNaN(paramSize) || paramSize < 1 ? 6 : paramSize;

  // Synchronize URL with active filters
  const updateUrl = useCallback(
    (newQ: string, newCat: string, newPage: number) => {
      const params = new URLSearchParams();
      if (newQ.trim()) params.set('q', newQ.trim());
      if (newCat && newCat !== 'all') params.set('category', newCat);
      if (newPage > 1) params.set('page', newPage.toString());
      if (pageSize !== 6) params.set('size', pageSize.toString());

      const queryStr = params.toString();
      const newPath = queryStr ? `/blog?${queryStr}` : '/blog';

      startTransition(() => {
        router.replace(newPath, { scroll: false });
      });
    },
    [router, pageSize]
  );

  // Category counts based on total verified articles
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: NOTES.length };
    BLOG_CATEGORIES.forEach((cat) => {
      if (cat.id !== 'all') {
        counts[cat.id] = NOTES.filter(
          (note) => note.archiveCategory === cat.id
        ).length;
      }
    });
    return counts;
  }, []);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return NOTES.filter((note) => {
      // Category filter check
      if (selectedCategory !== 'all') {
        if (note.archiveCategory !== selectedCategory) {
          return false;
        }
      }

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = note.title.toLowerCase().includes(q);
        const abstractMatch = note.abstract.toLowerCase().includes(q);
        const categoryMatch = note.category.toLowerCase().includes(q);
        const tagsMatch = note.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const sectionMatch = note.sections.some(
          (s) => s.heading.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
        );

        return titleMatch || abstractMatch || categoryMatch || tagsMatch || sectionMatch;
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedNotes = useMemo(() => {
    const startIndex = (validPage - 1) * pageSize;
    return filteredNotes.slice(startIndex, startIndex + pageSize);
  }, [filteredNotes, validPage, pageSize]);

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
            href="/#blog"
            className="archive-back-link"
            aria-label="Back to Portfolio — Return to homepage blog section"
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
              <BookOpen size={14} style={{ color: 'var(--color-gold)' }} />
              <span>PHILOZZ // ENGINEERING JOURNAL</span>
            </div>

            <h1 id="archive-title" className="archive-heading-main font-editorial-large">
              Ideas Worth Sharing.{' '}
              <span className="font-gold-gradient">Lessons Worth Keeping.</span>
            </h1>

            <p className="archive-heading-desc">
              Engineering notes, technical explorations, and lessons learned while building real
              software.
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
                  placeholder="Search articles by title, abstract, tech stack, or topic..."
                  className="archive-search-input"
                  aria-label="Search articles by title, abstract, tech stack, or topic"
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
                aria-label="Filter articles by category"
              >
                {BLOG_CATEGORIES.map((cat) => {
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
                  Showing {filteredNotes.length === 0 ? 0 : (validPage - 1) * pageSize + 1}–
                  {Math.min(validPage * pageSize, filteredNotes.length)} of{' '}
                  {filteredNotes.length} published{' '}
                  {filteredNotes.length === 1 ? 'article' : 'articles'}
                  {isFiltered && ` (Filtered from ${NOTES.length} total)`}
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
                RESPONSIVE ARTICLE GALLERY GRID
                3 columns desktop (>= 1280px), 2 columns tablet, 1 column mobile
                ======================================================== */}
            {filteredNotes.length > 0 ? (
              <div className="archive-grid">
                {paginatedNotes.map((note, idx) => {
                  const overallIndex = (validPage - 1) * pageSize + idx + 1;
                  const formattedIndex = overallIndex < 10 ? `0${overallIndex}` : `${overallIndex}`;

                  return (
                    <article
                      key={note.slug}
                      className="gallery-project-card"
                      data-note-index={overallIndex}
                      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    >
                      {/* Compact Architecture Schematic Preview */}
                      <div className="gallery-card-visual" style={{ minHeight: '160px', overflow: 'hidden' }}>
                        <BlogCardVisual slug={note.slug} />
                      </div>

                      {/* Card Body */}
                      <div className="gallery-card-body" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        {/* Index & Category */}
                        <div className="gallery-card-meta">
                          <span className="gallery-index-tag">{formattedIndex}</span>
                          <span className="gallery-meta-divider">/</span>
                          <span className="gallery-category-label">{note.category.toUpperCase()}</span>
                        </div>

                        {/* Title */}
                        <h2 className="gallery-project-title" style={{ fontSize: '1.28rem', lineHeight: '1.3' }}>
                          <Link href={`/notes/${note.slug}`} className="gallery-title-link">
                            {note.title}
                          </Link>
                        </h2>

                        {/* Summary / Abstract (15-16px, readable high contrast) */}
                        <p className="gallery-project-summary" style={{ fontSize: '0.96rem', lineHeight: '1.65', color: '#D6D6E2' }}>
                          {note.abstract}
                        </p>

                        {/* Tags / Topics */}
                        {note.tags && note.tags.length > 0 && (
                          <div className="gallery-tech-pills" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                            {note.tags.map((tag) => (
                              <span key={tag} className="badge-tech gallery-tech-badge">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Date and Read Time Meta Strip */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            marginTop: '1rem',
                            paddingTop: '0.85rem',
                            borderTop: '1px solid rgba(201, 164, 92, 0.12)',
                            fontSize: '0.82rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--color-gold-light)',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={13} style={{ color: 'var(--color-gold)' }} />
                            <span>{note.date}</span>
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={13} style={{ color: 'var(--color-gold)' }} />
                            <span>{note.readTime}</span>
                          </span>
                        </div>
                      </div>

                      {/* Action Link */}
                      <div className="gallery-card-footer">
                        <Link
                          href={`/notes/${note.slug}`}
                          className="btn-gold gallery-explore-btn"
                          aria-label={`Read full article: ${note.title}`}
                        >
                          <span>Read Full Article</span>
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
                <h3 className="archive-empty-title">No matching articles found</h3>
                <p className="archive-empty-desc">
                  No verified engineering articles matched your criteria{' '}
                  {searchQuery ? `"${searchQuery}"` : ''} in the{' '}
                  {selectedCategory !== 'all'
                    ? BLOG_CATEGORIES.find((c) => c.id === selectedCategory)?.label
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
                aria-label="Engineering journal archive pages navigation"
              >
                <button
                  type="button"
                  onClick={() => handlePageChange(validPage - 1)}
                  disabled={validPage <= 1}
                  className="archive-page-btn"
                  aria-label="Prev — Previous page"
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
                  aria-label="Next — Next page"
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
            <Link href="/#blog" className="archive-footer-link">
              <span>Return to Portfolio</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
