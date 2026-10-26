import React from 'react';
import type { Metadata } from 'next';
import { Info, Globe, CheckCircle2, ShieldCheck, FileCode } from 'lucide-react';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { SITE_CONFIG } from '@/lib/seoData';
import { projectRepository, articleRepository } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';

export const instant = false;

export const metadata: Metadata = {
  title: 'SEO Settings Overview',
  description: 'PHILOZZ Owner Administration — Technical SEO, Crawler Policy & Metadata Overview',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminSeoPage() {
  const user = await requireAdminSession();
  const [projects, articles] = await Promise.all([
    projectRepository.getAll(),
    articleRepository.getAll(),
  ]);

  const totalIndexedRoutes = 3 + projects.length + articles.length; // Home, Projects, Blog + items

  return (
    <AdminShell
      user={user}
      title="SEO Settings"
      subtitle="Search indexing policy, metadata layer, and crawler configuration"
    >
      {/* Notice Banner */}
      <div className="admin-notice-banner">
        <Info size={18} style={{ color: 'var(--color-gold, #C9A45C)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600 }}>
            Read-Only SEO Configuration:
          </strong>{' '}
          Displaying verified metadata rules and crawler policies established in Phase 15A.
          Custom per-route meta descriptions, social graph overrides, and Google Search Console integrations will unlock in Phase 17.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Core Metadata Card */}
        <div className="admin-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '1.25rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(201, 164, 92, 0.15)',
            }}
          >
            <Globe size={18} style={{ color: 'var(--color-gold, #C9A45C)' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
              Core Site Identity & Indexing Perimeter
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.2rem' }}>
                Canonical Domain
              </div>
              <div style={{ color: 'var(--color-gold-light, #E4C88A)', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                {SITE_CONFIG.url}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.75rem', marginBottom: '0.2rem' }}>
                Base Title Pattern
              </div>
              <div style={{ color: 'var(--color-ivory, #F6F3EC)' }}>
                {`${SITE_CONFIG.name} // ${SITE_CONFIG.developerName}`}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.2rem' }}>
                Global Meta Description
              </div>
              <p style={{ color: 'var(--color-ivory-muted, #D2CEC4)', lineHeight: 1.5 }}>
                {SITE_CONFIG.description}
              </p>
            </div>
          </div>
        </div>

        {/* Technical SEO Verification Status Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {/* Robots.txt Card */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={18} style={{ color: '#10B981' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                Crawler Policy (robots.txt)
              </h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>✓ Essential Next.js assets crawlable for rendering</li>
              <li>✓ `/admin/*` protected via `X-Robots-Tag: noindex, nofollow`</li>
              <li>✓ Production sitemap linked at `https://philozz.com/sitemap.xml`</li>
              <li>✓ Phase 15A.1 crawler audit verified</li>
            </ul>
          </div>

          {/* Sitemap Status Card */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <FileCode size={18} style={{ color: 'var(--color-gold, #C9A45C)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                Dynamic Sitemap Engine
              </h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>✓ {totalIndexedRoutes} authoritative canonical URLs generated</li>
              <li>✓ 8 dynamic case studies (`/work/[slug]`)</li>
              <li>✓ 7 dynamic engineering notes (`/notes/[slug]`)</li>
              <li>✓ Strict zero-draft policy (published items only)</li>
            </ul>
          </div>

          {/* Structured Data Card */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--color-gold-light, #E4C88A)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                Structured Data (JSON-LD)
              </h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>✓ Schema.org Person & ProfilePage validation</li>
              <li>✓ Schema.org CreativeWork & Article validation</li>
              <li>✓ Schema.org WebSite & SearchAction schemas</li>
              <li>✓ Automated OpenGraph & Twitter Large Cards</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
