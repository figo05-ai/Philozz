import React from 'react';
import type { Metadata } from 'next';
import { Info, Sparkles, User, Cpu, Mail } from 'lucide-react';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { siteContentRepository } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';

export const instant = false;

export const metadata: Metadata = {
  title: 'Site Sections Overview',
  description: 'PHILOZZ Owner Administration — Homepage Editorial Sections & 3D Orbit Geometry',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminSectionsPage() {
  const user = await requireAdminSession();
  const [homepageConfig, technologies, expertiseAreas] = await Promise.all([
    siteContentRepository.getHomepageConfig(),
    siteContentRepository.getTechnologies(),
    siteContentRepository.getExpertiseAreas(),
  ]);

  const { hero, about, contact } = homepageConfig;

  return (
    <AdminShell
      user={user}
      title="Site Sections"
      subtitle="Homepage cinematic scenes, editorial mosaic cards, and 3D orbit configuration"
    >
      {/* Notice Banner */}
      <div className="admin-notice-banner">
        <Info size={18} style={{ color: 'var(--color-gold, #C9A45C)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600 }}>
            Read-Only Section Architecture:
          </strong>{' '}
          All section text, mosaic cards, and 3D coordinate matrices are loaded from `siteContentRepository`.
          Visual content adjustments, inline copywriting edits, and real-time cache revalidation will unlock in Phase 17.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Section 1: Hero Cinematic Scene */}
        <div className="admin-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(201, 164, 92, 0.15)',
            }}
          >
            <Sparkles size={18} style={{ color: 'var(--color-gold, #C9A45C)' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
              Scene 01: Cinematic Hero
            </h2>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.72rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(201, 164, 92, 0.1)',
                color: 'var(--color-gold, #C9A45C)',
              }}
            >
              Managed Section
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.2rem' }}>
                Eyebrow Badge
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-gold-light, #E4C88A)', fontWeight: 600 }}>
                {hero.eyebrow}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.75rem', marginBottom: '0.2rem' }}>
                Main Headline Typography Stack
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-ivory, #F6F3EC)', lineHeight: 1.25 }}>
                {hero.titleLine1} {hero.titleLine2}
                <br />
                <span style={{ color: 'var(--color-gold, #C9A45C)' }}>{hero.titleLine3}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.2rem' }}>
                Editorial Subtitle
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-ivory-muted, #D2CEC4)', lineHeight: 1.5 }}>
                {hero.description}
              </p>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.75rem', marginBottom: '0.35rem' }}>
                Signature Core Words
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {hero.signatureWords.map((word) => (
                  <span key={word} className="admin-tag-pill">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: About Editorial Mosaic */}
        <div className="admin-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(201, 164, 92, 0.15)',
            }}
          >
            <User size={18} style={{ color: 'var(--color-gold, #C9A45C)' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
              Scene 02: About Editorial Mosaic ({about.mosaicCards.length} Cards)
            </h2>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.72rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(201, 164, 92, 0.1)',
                color: 'var(--color-gold, #C9A45C)',
              }}
            >
              Managed Section
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
            }}
          >
            {about.mosaicCards.map((card) => (
              <div
                key={card.id}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(10, 10, 13, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="admin-slug-pill">{card.id}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-gold, #C9A45C)', fontWeight: 600 }}>
                    {card.badge}
                  </span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.25rem' }}>
                  {card.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim, #9A9AA8)', lineHeight: 1.4 }}>
                  {card.subtitle}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: 3D Orbit Technologies Ecosystem */}
        <div className="admin-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(201, 164, 92, 0.15)',
            }}
          >
            <Cpu size={18} style={{ color: 'var(--color-gold, #C9A45C)' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
              Scene 03: 3D Galaxy Orbit Technologies ({technologies.length} Core Nodes)
            </h2>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.72rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(201, 164, 92, 0.1)',
                color: 'var(--color-gold, #C9A45C)',
              }}
            >
              Strictly Locked Geometry
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '1.25rem' }}>
            All orbital 3D coordinates, elliptical semi-axes, and inclination parameters are maintained verbatim to preserve cinematic Three.js stability.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {technologies.map((tech) => (
              <div
                key={tech.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(10, 10, 13, 0.5)',
                  border: '1px solid rgba(201, 164, 92, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                    {tech.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-gold-light, #E4C88A)' }}>
                    {tech.category}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', fontFamily: 'var(--font-mono, monospace)' }}>
                  Orbit: ({tech.x.toFixed(1)}%, {tech.y.toFixed(1)}%) • Scale: {tech.scale}x
                </div>
              </div>
            ))}
          </div>

          {/* Expertise Areas */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-gold, #C9A45C)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Associated Expertise Domains ({expertiseAreas.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {expertiseAreas.map((area) => (
                <span key={area.id} className="admin-tag-pill">
                  {area.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Contact Scene */}
        <div className="admin-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(201, 164, 92, 0.15)',
            }}
          >
            <Mail size={18} style={{ color: 'var(--color-gold, #C9A45C)' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
              Scene 06: Finale & Contact
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              fontSize: '0.85rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.2rem' }}>
                Primary Headline
              </div>
              <div style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600 }}>{contact.headline}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.25rem' }}>
                {contact.subheadline}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.2rem' }}>
                Contact Endpoints
              </div>
              <div style={{ color: 'var(--color-gold-light, #E4C88A)' }}>{contact.email}</div>
              <div style={{ color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.15rem' }}>{contact.location}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.2rem' }}>
                Social Platforms
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {contact.socialLinks.map((s) => (
                  <span key={s.platform} className="admin-tag-pill">
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
