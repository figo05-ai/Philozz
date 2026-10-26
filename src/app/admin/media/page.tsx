import React from 'react';
import type { Metadata } from 'next';
import { Info, Image as ImageIcon, HardDrive, Shield } from 'lucide-react';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { mediaRepository } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';
import { ContentTable, ColumnDef } from '@/components/admin/ContentTable';
import type { MediaAssetEntity } from '@/cms/models/media';

export const instant = false;

export const metadata: Metadata = {
  title: 'Media Library Overview',
  description: 'PHILOZZ Owner Administration — Digital Asset Repository & Provider Pipeline',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminMediaPage() {
  const user = await requireAdminSession();
  const assets = await mediaRepository.getAll();

  const columns: ColumnDef<MediaAssetEntity>[] = [
    {
      header: 'Asset Name & Details',
      accessor: (a) => (
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
            {a.originalName}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
            {a.altText || 'No alt text recorded'}
          </div>
        </div>
      ),
    },
    {
      header: 'Folder',
      accessor: (a) => (
        <span className="admin-slug-pill">
          {a.folder}
        </span>
      ),
    },
    {
      header: 'Type & Dimensions',
      accessor: (a) => (
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
          <div>{a.mimeType}</div>
          {a.dimensions && (
            <div style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-gold-light, #E4C88A)' }}>
              {a.dimensions.width} × {a.dimensions.height}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Size',
      accessor: (a) => (
        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-text-dim, #9A9AA8)' }}>
          {(a.sizeBytes / 1024).toFixed(1)} KB
        </span>
      ),
    },
    {
      header: 'Provider',
      accessor: (a) => (
        <span
          style={{
            fontSize: '0.72rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '4px',
            backgroundColor: 'rgba(201, 164, 92, 0.1)',
            color: 'var(--color-gold, #C9A45C)',
            border: '1px solid rgba(201, 164, 92, 0.25)',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {a.provider}
        </span>
      ),
    },
  ];

  return (
    <AdminShell
      user={user}
      title="Media Library"
      subtitle="Digital asset inventory and provider-independent storage architecture"
    >
      {/* Notice Banner */}
      <div className="admin-notice-banner">
        <Info size={18} style={{ color: 'var(--color-gold, #C9A45C)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600 }}>
            Read-Only Asset Architecture:
          </strong>{' '}
          Displaying {assets.length} registered assets from the Phase 16A `LocalMediaRepository`.
          Direct drag-and-drop file uploads, image optimization, and Firebase Storage integration will activate in Phase 17.
        </div>
      </div>

      {/* Media Pipeline Specs Card */}
      <div
        className="admin-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <HardDrive size={22} style={{ color: 'var(--color-gold, #C9A45C)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Active Provider</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
              Local Repository Seed
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ImageIcon size={22} style={{ color: 'var(--color-gold, #C9A45C)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Approved Formats</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-ivory, #F6F3EC)' }}>
              WebP, PNG, SVG, JPEG, PDF
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={22} style={{ color: 'var(--color-gold, #C9A45C)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Security Validation</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#34D399' }}>
              Enforced (5MB Max • MIME Checked)
            </div>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <ContentTable
        columns={columns}
        data={assets}
        keyExtractor={(a) => a.id}
        ariaLabel="Media Assets"
      />
    </AdminShell>
  );
}
