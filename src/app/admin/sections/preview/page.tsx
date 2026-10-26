import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { siteContentRepository } from '@/cms/repositories';
import { HomePageClient } from '@/components/HomePageClient';

export const instant = false;

export const metadata: Metadata = {
  title: 'Homepage Private Preview // PHILOZZ Admin',
  description: 'Owner-only private preview of unpublished draft section configurations',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

export default async function AdminSectionsPreviewPage() {
  await requireAdminSession();

  // Fetch draft if exists, falling back to published
  const [previewConfig, brandInfo] = await Promise.all([
    siteContentRepository.getHomepageConfig({ preview: true }),
    siteContentRepository.getBrandInfo(),
  ]);

  const isDraft = previewConfig.status === 'draft';

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Sticky Owner HUD Header */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(10, 10, 14, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(201, 164, 92, 0.35)',
          padding: '0.65rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/admin/sections"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--color-gold, #C9A45C)',
              fontSize: '0.82rem',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={14} />
            <span>Return to Studio</span>
          </Link>

          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} style={{ color: 'var(--color-gold, #C9A45C)' }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600 }}>
              PRIVATE OWNER PREVIEW
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 600,
                backgroundColor: isDraft ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: isDraft ? '#EAB308' : '#10B981',
                border: `1px solid ${isDraft ? 'rgba(234, 179, 8, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              }}
            >
              {isDraft ? `Draft v${previewConfig.version || 1} (Unpublished)` : `Live Published v${previewConfig.version || 1}`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
            Search engines blocked (noindex, nofollow, noarchive)
          </span>

          <Link
            href="/admin/sections"
            className="btn-gold"
            style={{
              padding: '0.35rem 0.85rem',
              fontSize: '0.78rem',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            <span>Edit Sections</span>
          </Link>
        </div>
      </div>

      {/* Main Homepage Render with Draft Configurations */}
      <div style={{ paddingTop: '52px' }}>
        <HomePageClient homepageConfig={previewConfig} brandInfo={brandInfo} />
      </div>
    </div>
  );
}
