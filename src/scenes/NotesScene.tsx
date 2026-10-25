'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Clock, Calendar } from 'lucide-react';
import { NOTES, BRAND_INFO, PHOTO_ASSETS } from '@/data/portfolioData';

export function NotesScene() {
  return (
    <section id="blog" className="scene-section scene-notes" aria-labelledby="notes-title">
      <span id="notes" style={{ position: 'absolute', top: 0, opacity: 0, pointerEvents: 'none' }} />
      <div className="container-editorial">
        {/* Section Header */}
        <div style={{ maxWidth: '820px' }} className="notes-header-wrapper">
          <div className="section-tag">
            <BookOpen size={14} style={{ color: 'var(--color-gold)' }} />
            <span>ENGINEERING JOURNAL // BLOG</span>
          </div>

          <h2 id="notes-title" className="font-editorial-large" style={{ marginBottom: '1.25rem' }}>
            Thoughts. Learnings. <span className="font-gold-gradient">Progress.</span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
              color: 'var(--color-ivory)',
              lineHeight: 1.68,
            }}
          >
            I write about backend engineering, distributed queue topologies, query plan optimization,
            and the mindset required to build scalable software.
          </p>
        </div>

        {/* Split Editorial Layout */}
        <div className="journal-layout">
          {/* Left Column: Atmospheric Personal Portrait & Philosophy Quote */}
          <div>
            <div className="journal-portrait-card">
              <Image
                src={PHOTO_ASSETS.portraitSitting}
                alt="Felopater Nabil — Engineer at Work"
                width={768}
                height={920}
                sizes="(max-width: 960px) 100vw, 420px"
              />

              <div className="journal-quote-box">
                <blockquote
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(1.15rem, 2vw, 1.35rem)',
                    fontStyle: 'italic',
                    color: 'var(--color-ivory)',
                    lineHeight: 1.45,
                    marginBottom: '1rem',
                  }}
                >
                  &ldquo;Better Developers Build a Brighter Internet.&rdquo;
                </blockquote>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: 'var(--color-gold-light)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  — {BRAND_INFO.name} {'//'} ARCHITECTURAL NOTES
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Article Cards */}
          <div className="journal-articles-list">
            {NOTES.slice(0, 4).map((note) => (
              <Link
                key={note.slug}
                href={`/notes/${note.slug}`}
                className="journal-article-card"
                aria-label={`Read engineering note: ${note.title}`}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    color: 'var(--color-gold-light)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span className="badge-gold">{note.category}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#D6D6E2' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: 'var(--color-gold-light)' }} />
                      <span>{note.date}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} style={{ color: 'var(--color-gold-light)' }} />
                      <span>{note.readTime}</span>
                    </span>
                  </div>
                </div>

                <h3 className="journal-article-title">
                  {note.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.975rem',
                    lineHeight: 1.65,
                    color: 'var(--color-ivory)',
                    marginBottom: '1.25rem',
                  }}
                >
                  {note.abstract}
                </p>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--color-gold-light)',
                  }}
                >
                  <span>Read Article</span>
                  <ArrowUpRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
