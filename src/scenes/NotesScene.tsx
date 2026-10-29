'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Clock, Calendar, Sparkles } from 'lucide-react';
import { NOTES, BRAND_INFO, PHOTO_ASSETS } from '@/data/portfolioData';
import { ArticleEntity } from '@/cms/models/article';
import { ProjectsToBlogTransition } from '@/components/ProjectsToBlogTransition';
import {
  ApiArchitectureVisual,
  WorkflowVisual,
  LessonsVisual,
  SqlOptimizationVisual,
} from '@/components/JournalVisuals';

export interface NotesSceneProps {
  featuredArticles?: ArticleEntity[];
}

export function NotesScene({ featuredArticles: propsArticles }: NotesSceneProps = {}) {
  const articles = propsArticles && propsArticles.length > 0 ? propsArticles : NOTES;
  // Dominant Featured Article (Row 2)
  const featuredArticle = articles[0] || NOTES[0];

  // Three Secondary Articles (Row 3)
  const secondaryArticles = articles.length > 1 ? articles.slice(1, 4) : NOTES.slice(1, 4);

  return (
    <section id="blog" className="scene-section scene-notes" aria-labelledby="notes-title">
      {/* Cinematic Transition Bridge: Projects -> Blog ("THE ENGINEERING MANUSCRIPT") */}
      <ProjectsToBlogTransition />
      <span id="notes" style={{ position: 'absolute', top: 0, opacity: 0, pointerEvents: 'none' }} />

      <div className="container-editorial">
        {/* ========================================================
            ROW 1: EDITORIAL HEADER & REFINED AUTHOR IDENTITY
            ======================================================== */}
        <div className="notes-header-wrapper journal-header-row">
          <div className="journal-header-text">
            <div className="section-tag">
              <BookOpen size={14} style={{ color: 'var(--color-gold)' }} />
              <span>ENGINEERING JOURNAL // BLOG</span>
            </div>

            <h2 id="notes-title" className="font-editorial-large journal-editorial-heading">
              Thoughts. Learnings. <span className="font-gold-gradient">Progress.</span>
            </h2>

            <p className="journal-editorial-description">
              I write about backend engineering, distributed queue topologies, query plan optimization,
              and the mindset required to build scalable software.
            </p>
          </div>

          {/* Refined Author Identity Badge (Replaces oversized portrait) */}
          <div className="journal-author-badge journal-portrait-card">
            <div className="journal-author-avatar-wrap">
              <Image
                src={PHOTO_ASSETS.portraitSitting}
                alt="Felopater Nabil — Engineer at Work"
                width={52}
                height={52}
                loading="lazy"
                quality={85}
                className="journal-author-avatar-img"
              />
              <span className="journal-author-status-dot" aria-hidden="true" />
            </div>

            <div className="journal-author-details">
              <div className="journal-author-name">{BRAND_INFO.developerName}</div>
              <div className="journal-author-role">Backend-focused Full-Stack Engineer</div>
              <div className="journal-author-meta-bar">
                <span className="journal-author-tag">AUTHOR & ARCHITECT</span>
                <span className="journal-author-bullet" aria-hidden="true">•</span>
                <span className="journal-author-tag text-gold">PRODUCTION ESSAYS</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            ROW 2: DOMINANT FEATURED ARTICLE (Wide Asymmetrical Editorial Panel)
            ======================================================== */}
        <div className="journal-featured-wrapper">
          <Link
            href={`/notes/${featuredArticle.slug}`}
            className="journal-article-card journal-featured-card"
            aria-label={`Read featured engineering article: ${featuredArticle.title}`}
          >
            {/* Left Content Column */}
            <div className="journal-featured-content">
              <div className="journal-featured-meta-header">
                <div className="journal-badge-group">
                  <span className="badge-gold">FEATURED ARTICLE</span>
                  <span className="badge-tech">{featuredArticle.category.toUpperCase()}</span>
                </div>

                <div className="journal-meta-cluster">
                  <span className="journal-meta-item">
                    <Calendar size={14} className="text-gold" />
                    <span>{featuredArticle.date}</span>
                  </span>
                  <span className="journal-meta-item">
                    <Clock size={14} className="text-gold" />
                    <span>{featuredArticle.readTime}</span>
                  </span>
                </div>
              </div>

              <h3 className="journal-featured-title">
                {featuredArticle.title}
              </h3>

              <p className="journal-featured-description">
                {featuredArticle.abstract}
              </p>

              {/* Architectural Topics / Highlights */}
              <div className="journal-tech-pills">
                <span className="badge-tech">Laravel 11/13</span>
                <span className="badge-tech">FormRequest Idempotency</span>
                <span className="badge-tech">OpenAPI 3.0</span>
                <span className="badge-tech">Redis Caching</span>
              </div>

              {/* Action Link Button */}
              <div className="journal-read-action journal-featured-action">
                <span>Read Full Case Article</span>
                <ArrowUpRight size={17} />
              </div>
            </div>

            {/* Right Visualization Column */}
            <div className="journal-featured-visual-wrapper">
              <ApiArchitectureVisual />
            </div>
          </Link>
        </div>

        {/* ========================================================
            ROW 3: THREE SECONDARY ARTICLE CARDS (Side by Side on Desktop)
            ======================================================== */}
        <div className="journal-secondary-grid">
          {secondaryArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/notes/${article.slug}`}
              className="journal-article-card journal-secondary-card"
              aria-label={`Read engineering article: ${article.title}`}
            >
              {/* Meaningful Technical Visual Header */}
              <div className="journal-secondary-visual-slot">
                {article.slug === 'my-development-workflow-2026' && <WorkflowVisual />}
                {article.slug === 'what-ive-learned-as-a-developer' && <LessonsVisual />}
                {article.slug === 'sql-query-optimization' && <SqlOptimizationVisual />}
              </div>

              {/* Card Body */}
              <div className="journal-secondary-body">
                {/* Category & Read Time */}
                <div className="journal-secondary-meta-row">
                  <span className="badge-gold">{article.category.toUpperCase()}</span>
                  <span className="journal-meta-item">
                    <Clock size={13} className="text-gold" />
                    <span>{article.readTime}</span>
                  </span>
                </div>

                {/* Title */}
                <h4 className="journal-secondary-title">
                  {article.title}
                </h4>

                {/* Description */}
                <p className="journal-secondary-description">
                  {article.abstract}
                </p>
              </div>

              {/* Card Footer Action */}
              <div className="journal-secondary-footer">
                <span className="journal-meta-item">
                  <Calendar size={13} className="text-gold" />
                  <span>{article.date}</span>
                </span>

                <div className="journal-read-action">
                  <span>Read Article</span>
                  <ArrowUpRight size={15} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Blogs Action Link — Navigates to dedicated /blog archive */}
        <div className="journal-toggle-wrapper">
          <Link
            href="/blog"
            className="btn-outline-gold journal-toggle-btn"
            aria-label={`View all ${NOTES.length} engineering articles in the journal archive`}
          >
            <Sparkles size={16} style={{ color: 'var(--color-gold)' }} />
            <span>View All Blogs ({NOTES.length})</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
