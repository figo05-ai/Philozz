import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Info, FileText } from 'lucide-react';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { articleRepository } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';
import { ContentTable, ColumnDef } from '@/components/admin/ContentTable';
import { StatusIndicator } from '@/components/admin/StatusIndicator';
import type { ArticleEntity } from '@/cms/models/article';

export const instant = false;

export const metadata: Metadata = {
  title: 'Blog & Writeups Inventory',
  description: 'PHILOZZ Owner Administration — Engineering Journal & Notes Inventory',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminArticlesPage() {
  const user = await requireAdminSession();
  const [articles, categories] = await Promise.all([
    articleRepository.getAll(),
    articleRepository.getCategories(),
  ]);

  const columns: ColumnDef<ArticleEntity>[] = [
    {
      header: 'Title & Excerpt',
      accessor: (a) => (
        <div style={{ maxWidth: '340px' }}>
          <div
            style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: 'var(--color-ivory, #F6F3EC)',
              marginBottom: '0.2rem',
              lineHeight: 1.3,
            }}
          >
            {a.title}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-dim, #9A9AA8)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {a.abstract}
          </div>
        </div>
      ),
    },
    {
      header: 'Slug',
      accessor: (a) => (
        <span className="admin-slug-pill">
          /{a.slug}
        </span>
      ),
    },
    {
      header: 'Category',
      accessor: (a) => (
        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--color-gold-light, #E4C88A)',
            fontWeight: 500,
          }}
        >
          {a.category}
        </span>
      ),
    },
    {
      header: 'Read Time',
      width: '100px',
      accessor: (a) => (
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
          {a.readTime}
        </span>
      ),
    },
    {
      header: 'Published Date',
      width: '120px',
      accessor: (a) => (
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
          {a.date}
        </span>
      ),
    },
    {
      header: 'Status',
      width: '120px',
      accessor: (a) => <StatusIndicator status={a.status} />,
    },
    {
      header: 'Featured',
      width: '110px',
      accessor: (a) =>
        a.featured ? (
          <StatusIndicator status="featured" label={`Featured #${a.featuredOrder || 1}`} size="sm" />
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #808092)' }}>—</span>
        ),
    },
    {
      header: 'Live View',
      width: '90px',
      align: 'center',
      accessor: (a) => (
        <Link
          href={`/notes/${a.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          title={`View live article: ${a.title}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.78rem',
            color: 'var(--color-gold, #C9A45C)',
            textDecoration: 'none',
            padding: '0.35rem 0.55rem',
            borderRadius: '6px',
            backgroundColor: 'rgba(201, 164, 92, 0.08)',
            border: '1px solid rgba(201, 164, 92, 0.2)',
          }}
        >
          <span>View</span>
          <ExternalLink size={12} />
        </Link>
      ),
    },
  ];

  return (
    <AdminShell
      user={user}
      title="Blog & Writeups"
      subtitle="Engineering notes, technical articles, and architecture essays"
    >
      {/* Notice Banner */}
      <div className="admin-notice-banner">
        <Info size={18} style={{ color: 'var(--color-gold, #C9A45C)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600 }}>
            Read-Only Inventory Mode:
          </strong>{' '}
          Displaying all {articles.length} articles across {categories.length} taxonomy categories.
          Rich-text editing, syntax-highlighted code block authoring, and drafting controls will unlock in Phase 17.
        </div>
      </div>

      {/* Header Metric Summary Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          backgroundColor: 'var(--color-charcoal-card, #16161D)',
          border: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.22))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <FileText size={18} style={{ color: 'var(--color-gold, #C9A45C)' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
            {articles.length} Total Registered Articles
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.78rem' }}>
          <span style={{ color: '#34D399' }}>
            ● {articles.filter((a) => a.status === 'published').length} Published
          </span>
          <span style={{ color: 'var(--color-gold-light, #E4C88A)' }}>
            ★ {articles.filter((a) => a.featured).length} Featured
          </span>
          <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>
            {categories.length} Categories
          </span>
        </div>
      </div>

      {/* Articles Table */}
      <ContentTable
        columns={columns}
        data={articles}
        keyExtractor={(a) => a.id}
        ariaLabel="Blog & Engineering Notes"
      />
    </AdminShell>
  );
}
