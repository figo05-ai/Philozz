import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Clock, Calendar, Sparkles } from 'lucide-react';
import { NOTES, BRAND_INFO, PHOTO_ASSETS } from '@/data/portfolioData';

export function generateStaticParams() {
  return NOTES.map((n) => ({
    slug: n.slug,
  }));
}

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = NOTES.find((n) => n.slug === slug);

  if (!note) {
    notFound();
  }

  const otherNotes = NOTES.filter((n) => n.slug !== slug).slice(0, 3);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-obsidian)', color: 'var(--color-ivory)' }}>
      {/* Top Header Navigation */}
      <header
        style={{
          borderBottom: '1px solid var(--color-border-dark)',
          padding: '1.25rem 0',
          position: 'sticky',
          top: 0,
          background: 'rgba(10, 10, 13, 0.92)',
          backdropFilter: 'blur(14px)',
          zIndex: 50,
        }}
      >
        <div className="container-editorial" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link
            href="/#blog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              color: 'var(--color-gold-light)',
              fontSize: '0.92rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={16} />
            <span>BACK TO JOURNAL</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-ivory)' }}>
              {BRAND_INFO.name}
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-gold)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#D6D6E2', letterSpacing: '0.06em' }}>
              ENGINEERING JOURNAL
            </span>
          </div>
        </div>
      </header>

      <main className="container-editorial" style={{ padding: 'clamp(2.5rem, 5vw, 5rem) 1.5rem', maxWidth: '860px' }}>
        {/* Article Meta Header */}
        <article>
          <header style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.88rem', flexWrap: 'wrap' }}>
              <span className="gold-badge">
                {note.category}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D6D6E2' }}>
                <Calendar size={14} style={{ color: 'var(--color-gold-light)' }} />
                {note.date}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D6D6E2' }}>
                <Clock size={14} style={{ color: 'var(--color-gold-light)' }} />
                {note.readTime}
              </span>
            </div>

            <h1
              className="font-editorial-large"
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
                lineHeight: 1.1,
                marginBottom: '2rem',
                color: 'var(--color-ivory)',
              }}
            >
              {note.title}
            </h1>

            <p
              style={{
                fontSize: '1.25rem',
                lineHeight: 1.65,
                color: 'var(--color-gold-light)',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                borderLeft: '3px solid var(--color-gold)',
                paddingLeft: '1.5rem',
                marginBottom: '2.5rem',
                background: 'rgba(201, 164, 92, 0.04)',
                padding: '1.25rem 1.5rem',
                borderRadius: '0 8px 8px 0',
              }}
            >
              {note.abstract}
            </p>

            <div style={{ height: '1px', background: 'var(--color-border-dark)', width: '100%' }} />
          </header>

          {/* Article Content Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {note.sections.map((section, idx) => (
              <section key={idx}>
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.65rem',
                    fontWeight: 700,
                    marginBottom: '1rem',
                    color: 'var(--color-ivory)',
                  }}
                >
                  {section.heading}
                </h2>

                <p
                  style={{
                    fontSize: '1.075rem',
                    lineHeight: 1.8,
                    color: 'var(--color-ivory)',
                    marginBottom: section.codeSnippet ? '1.5rem' : '0',
                  }}
                >
                  {section.content}
                </p>

                {section.codeSnippet && (
                  <pre
                    style={{
                      background: 'var(--color-charcoal)',
                      border: '1px solid var(--color-border-dark)',
                      borderRadius: '8px',
                      padding: '1.25rem 1.5rem',
                      overflowX: 'auto',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      color: 'var(--color-gold-light)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    }}
                    tabIndex={0}
                  >
                    <code>{section.codeSnippet}</code>
                  </pre>
                )}
              </section>
            ))}
          </div>

          {/* Author Signature Box */}
          <div
            style={{
              marginTop: '4.5rem',
              padding: '2rem',
              borderRadius: '12px',
              background: 'var(--color-charcoal)',
              border: '1px solid var(--color-border-dark)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-gold)', flexShrink: 0 }}>
              <Image
                src={PHOTO_ASSETS.portraitThinking}
                alt={BRAND_INFO.developerName}
                fill
                style={{ objectFit: 'cover' }}
                sizes="80px"
              />
            </div>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ivory)' }}>
                {BRAND_INFO.developerName}
              </div>
              <div style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-gold-light)', marginBottom: '8px' }}>
                {BRAND_INFO.role} • {BRAND_INFO.domain}
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-ivory)', lineHeight: 1.6, margin: 0 }}>
                Writing about distributed systems, resilient queues, database indexing, and pragmatic software craftsmanship.
              </p>
            </div>
          </div>
        </article>

        {/* Read Next Section */}
        <section style={{ borderTop: '1px solid var(--color-border-dark)', marginTop: '5rem', paddingTop: '3.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <Sparkles size={16} style={{ color: 'var(--color-gold-light)' }} />
            <h2 style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-gold-light)' }}>
              MORE ESSAYS & ENGINEERING NOTES
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3.5rem' }}>
            {otherNotes.map((other) => (
              <Link
                key={other.slug}
                href={`/notes/${other.slug}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  background: 'var(--color-charcoal)',
                  border: '1px solid var(--color-border-dark)',
                  borderRadius: '10px',
                  padding: '1.5rem 1.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.25s ease',
                }}
                className="mosaic-card"
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-gold-light)', marginBottom: '6px' }}>
                    {other.category.toUpperCase()} • {other.readTime}
                  </div>
                  <h3 style={{ fontSize: '1.22rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--color-ivory)' }}>
                    {other.title}
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-gold-light)', flexShrink: 0 }}>
                  <span>Read Essay</span>
                  <ArrowUpRight size={16} />
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href="/#blog" className="btn-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={16} />
              <span>Back to Engineering Journal</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
