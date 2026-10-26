import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { articleRepository } from '@/cms/repositories';
import { BRAND_INFO, PHOTO_ASSETS } from '@/data/portfolioData';

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await articleRepository.getById(id, { includeDeleted: true });

  return {
    title: article ? `Preview: ${article.title}` : 'Article Preview',
    description: 'Owner Private Preview — Engineering Journal Article',
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      nocache: true,
    },
  };
}

export default async function AdminArticlePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;

  const article = await articleRepository.getById(id, { includeDeleted: true });
  if (!article) {
    notFound();
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-obsidian, #0A0A0D)', color: 'var(--color-ivory, #F6F3EC)' }}>
      {/* Sticky Owner Preview HUD */}
      <header
        role="region"
        aria-label="Owner Preview Controls"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(22, 22, 29, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(201, 164, 92, 0.35)',
          padding: '0.75rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(201, 164, 92, 0.15)',
                color: 'var(--color-gold, #C9A45C)',
                border: '1px solid rgba(201, 164, 92, 0.35)',
                borderRadius: '6px',
                padding: '0.25rem 0.55rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono, monospace)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <ShieldAlert size={13} />
              <span>Owner Preview</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor:
                    article.isDeleted
                      ? 'rgba(239, 68, 68, 0.15)'
                      : article.status === 'published'
                      ? 'rgba(52, 211, 153, 0.15)'
                      : 'rgba(201, 164, 92, 0.15)',
                  color:
                    article.isDeleted
                      ? '#F87171'
                      : article.status === 'published'
                      ? '#34D399'
                      : 'var(--color-gold-light, #E4C88A)',
                  border: `1px solid ${
                    article.isDeleted
                      ? 'rgba(239, 68, 68, 0.3)'
                      : article.status === 'published'
                      ? 'rgba(52, 211, 153, 0.3)'
                      : 'rgba(201, 164, 92, 0.3)'
                  }`,
                }}
              >
                {article.isDeleted ? 'In Trash' : article.status.toUpperCase()}
              </span>

              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                Slug: <code style={{ color: 'var(--color-ivory)' }}>/notes/{article.slug}</code>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Link
              href="/admin/articles"
              className="admin-btn admin-btn-ghost"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', minHeight: '32px' }}
            >
              <ArrowLeft size={14} />
              <span>Articles Studio</span>
            </Link>

            <Link
              href={`/admin/articles/${article.id}`}
              className="admin-btn admin-btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', minHeight: '32px' }}
            >
              <Edit size={14} />
              <span>Edit Article</span>
            </Link>

            {article.status === 'published' && !article.isDeleted && (
              <Link
                href={`/notes/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn-primary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', minHeight: '32px' }}
              >
                <span>Live View</span>
                <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Article Container Matching Public Page Fidelity */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '3.5rem 1.5rem 6rem' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '2.5rem' }}>
          <Link
            href="/admin/articles"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              color: 'var(--color-gold-light, #E4C88A)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <ArrowLeft size={16} />
            <span>RETURN TO ARTICLES STUDIO</span>
          </Link>
        </div>

        <article>
          <header style={{ marginBottom: '3.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.25rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.88rem',
                flexWrap: 'wrap',
              }}
            >
              <span className="gold-badge">{article.category}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D6D6E2' }}>
                <Calendar size={14} style={{ color: 'var(--color-gold-light)' }} />
                {article.date}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D6D6E2' }}>
                <Clock size={14} style={{ color: 'var(--color-gold-light)' }} />
                {article.readTime}
              </span>
            </div>

            <h1
              className="font-editorial-large"
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
                lineHeight: 1.1,
                marginBottom: '2rem',
                color: 'var(--color-ivory, #F6F3EC)',
              }}
            >
              {article.title}
            </h1>

            <p
              style={{
                fontSize: '1.25rem',
                lineHeight: 1.65,
                color: 'var(--color-gold-light, #E4C88A)',
                fontFamily: 'var(--font-serif, serif)',
                fontStyle: 'italic',
                borderLeft: '3px solid var(--color-gold, #C9A45C)',
                paddingLeft: '1.5rem',
                marginBottom: '2.5rem',
                background: 'rgba(201, 164, 92, 0.04)',
                padding: '1.25rem 1.5rem',
                borderRadius: '0 8px 8px 0',
              }}
            >
              {article.abstract}
            </p>

            <div style={{ height: '1px', background: 'var(--color-border-dark, rgba(201, 164, 92, 0.2))', width: '100%' }} />
          </header>

          {/* Article Content Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {article.sections.map((section, idx) => (
              <section key={idx}>
                <h2
                  style={{
                    fontFamily: 'var(--font-serif, serif)',
                    fontSize: '1.65rem',
                    fontWeight: 700,
                    marginBottom: '1rem',
                    color: 'var(--color-ivory, #F6F3EC)',
                  }}
                >
                  {section.heading}
                </h2>

                <p
                  style={{
                    fontSize: '1.075rem',
                    lineHeight: 1.8,
                    color: 'var(--color-ivory, #F6F3EC)',
                    marginBottom: section.codeSnippet ? '1.5rem' : '0',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {section.content}
                </p>

                {section.codeSnippet && (
                  <pre
                    style={{
                      background: 'var(--color-charcoal, #121218)',
                      border: '1px solid var(--color-border-dark, rgba(201, 164, 92, 0.2))',
                      borderRadius: '8px',
                      padding: '1.25rem 1.5rem',
                      overflowX: 'auto',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      color: 'var(--color-gold-light, #E4C88A)',
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
              background: 'var(--color-charcoal, #121218)',
              border: '1px solid var(--color-border-dark, rgba(201, 164, 92, 0.2))',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-gold)', position: 'relative', flexShrink: 0 }}>
              <Image
                src={PHOTO_ASSETS.portraitThinking}
                alt="Felopater Nabil"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-ivory)' }}>
                {BRAND_INFO.developerName}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-gold-light)', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>
                {BRAND_INFO.role} {'//'} {BRAND_INFO.name}
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-dim)', maxWidth: '48ch', lineHeight: 1.5 }}>
                Specializing in backend engineering, distributed queue topologies, database optimization, and high-concurrency architecture.
              </p>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
