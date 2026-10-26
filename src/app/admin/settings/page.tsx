import React from 'react';
import type { Metadata } from 'next';
import { Info, Settings, ShieldCheck, Key, Lock, UserCheck } from 'lucide-react';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { siteContentRepository } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';

export const instant = false;

export const metadata: Metadata = {
  title: 'Site Settings Overview',
  description: 'PHILOZZ Owner Administration — Brand Configuration & Authentication Perimeter',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminSettingsPage() {
  const user = await requireAdminSession();
  const brandInfo = await siteContentRepository.getBrandInfo();

  return (
    <AdminShell
      user={user}
      title="Site Settings"
      subtitle="Brand identity, developer credentials, and authentication security policy"
    >
      {/* Notice Banner */}
      <div className="admin-notice-banner">
        <Info size={18} style={{ color: 'var(--color-gold, #C9A45C)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600 }}>
            Read-Only Settings Architecture:
          </strong>{' '}
          Displaying current site metadata and verified security configurations.
          Direct profile editing, session expiration customization, and secret rotation tools will activate in Phase 17.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Security & Authentication Perimeter Card */}
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
            <ShieldCheck size={18} style={{ color: '#10B981' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
              Authentication & Security Perimeter
            </h2>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.72rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 600,
              }}
            >
              Strictly Enforced
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <UserCheck size={18} style={{ color: 'var(--color-gold, #C9A45C)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                  Authorized Owner Identity
                </div>
                <div style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600 }}>
                  {user.email || 'Owner Account'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)', fontFamily: 'var(--font-mono, monospace)' }}>
                  UID: {user.uid}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <Key size={18} style={{ color: 'var(--color-gold, #C9A45C)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                  Role & Claims
                </div>
                <div style={{ color: '#34D399', fontWeight: 600 }}>
                  Custom Claim: admin === true
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                  Cryptographically verified on server boundary
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <Lock size={18} style={{ color: 'var(--color-gold, #C9A45C)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                  Session Policy
                </div>
                <div style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600 }}>
                  HttpOnly • Secure • SameSite=Lax
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                  5-day rotation • checkRevoked=true
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Information Card */}
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
            <Settings size={18} style={{ color: 'var(--color-gold, #C9A45C)' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
              Brand & Professional Identity
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Developer Name</div>
              <div style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600 }}>{brandInfo.developerName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gold-light, #E4C88A)', marginTop: '0.2rem' }}>
                {brandInfo.role}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Location & Experience</div>
              <div style={{ color: 'var(--color-ivory, #F6F3EC)' }}>{brandInfo.location}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.2rem' }}>
                {brandInfo.experienceYears} Years • {brandInfo.projectsCount} Built
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Contact Email</div>
              <div style={{ color: 'var(--color-gold-light, #E4C88A)' }}>{brandInfo.email}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.2rem' }}>
                Brand Domain: {brandInfo.domain}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
