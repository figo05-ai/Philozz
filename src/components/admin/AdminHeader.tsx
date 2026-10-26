'use client';

import React from 'react';
import { Menu, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { AdminUser } from '@/lib/auth/session';

interface AdminHeaderProps {
  onMenuToggle: () => void;
  user: AdminUser;
  title?: string;
  subtitle?: string;
}

export function AdminHeader({
  onMenuToggle,
  user,
  title,
  subtitle,
}: AdminHeaderProps) {
  return (
    <header className="admin-header">
      {/* Left: Mobile hamburger toggle & page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onMenuToggle}
          className="admin-btn-touch"
          aria-label="Toggle navigation menu"
          style={{
            background: 'none',
            border: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.22))',
            borderRadius: '8px',
            color: 'var(--color-gold, #C9A45C)',
            cursor: 'pointer',
            padding: '0.45rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Menu size={20} />
        </button>

        <div>
          {title && (
            <h1
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--color-ivory, #F6F3EC)',
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <span
              className="admin-header-subtitle"
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-dim, #9A9AA8)',
                display: 'block',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right: CMS status badge & live website shortcut */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(201, 164, 92, 0.08)',
            border: '1px solid rgba(201, 164, 92, 0.25)',
            color: 'var(--color-gold-light, #E4C88A)',
            fontSize: '0.72rem',
            fontWeight: 500,
          }}
          className="admin-header-status-pill"
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
            }}
          />
          <span>Phase 16C • Read-Only</span>
        </div>

        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34D399',
            fontSize: '0.72rem',
            fontWeight: 500,
          }}
          className="admin-header-user-pill"
          title={`Verified UID: ${user.uid}`}
        >
          <span>{user.email || 'Owner'}</span>
        </div>

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--color-ivory, #F6F3EC)',
            fontSize: '0.78rem',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-gold, #C9A45C)';
            e.currentTarget.style.color = 'var(--color-gold, #C9A45C)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = 'var(--color-ivory, #F6F3EC)';
          }}
        >
          <span>Live Site</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      <style jsx>{`
        @media (min-width: 640px) {
          .admin-header-status-pill,
          .admin-header-user-pill {
            display: inline-flex !important;
          }
        }
        @media (min-width: 1024px) {
          header button {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
