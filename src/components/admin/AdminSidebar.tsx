'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Layers,
  Image,
  Search,
  Settings,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { SignOutButton } from './SignOutButton';
import type { AdminUser } from '@/lib/auth/session';

interface AdminSidebarProps {
  user: AdminUser;
  onNavigate?: () => void;
}

export const ADMIN_NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Overview',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin/projects',
    label: 'Projects',
    icon: FolderKanban,
  },
  {
    href: '/admin/articles',
    label: 'Blog & Writeups',
    icon: FileText,
  },
  {
    href: '/admin/sections',
    label: 'Site Sections',
    icon: Layers,
  },
  {
    href: '/admin/media',
    label: 'Media Library',
    icon: Image,
  },
  {
    href: '/admin/seo',
    label: 'SEO Settings',
    icon: Search,
  },
  {
    href: '/admin/settings',
    label: 'Site Settings',
    icon: Settings,
  },
];

export function AdminSidebar({ user, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        padding: '1.25rem 0',
      }}
    >
      {/* Brand Header */}
      <div>
        <div
          style={{
            padding: '0.5rem 1.25rem 1.25rem 1.25rem',
            borderBottom: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.22))',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.35rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-serif, serif)',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'var(--color-ivory, #F6F3EC)',
              }}
            >
              PHILOZZ
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(201, 164, 92, 0.15)',
                color: 'var(--color-gold, #C9A45C)',
                border: '1px solid rgba(201, 164, 92, 0.3)',
              }}
            >
              CMS Studio
            </span>
          </div>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              color: 'var(--color-text-dim, #9A9AA8)',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold, #C9A45C)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-dim, #9A9AA8)')}
          >
            <span>View Public Site</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        {/* Navigation List */}
        <nav
          style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
          aria-label="Admin Navigation"
        >
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`admin-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Session & Identity Footer */}
      <div
        style={{
          padding: '1rem 1.25rem 0.5rem 1.25rem',
          borderTop: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.22))',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={16} />
          </div>

          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-ivory, #F6F3EC)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={user.email || 'Owner'}
            >
              {user.email || 'Verified Owner'}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: '#10B981',
                fontWeight: 500,
              }}
            >
              Owner • admin: true
            </div>
          </div>
        </div>

        <SignOutButton label="Sign Out" />
      </div>
    </div>
  );
}
