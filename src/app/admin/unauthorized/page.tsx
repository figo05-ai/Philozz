import React from 'react';
import type { Metadata } from 'next';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SignOutButton } from '@/components/admin/SignOutButton';

export const metadata: Metadata = {
  title: 'Access Denied',
  description: 'PHILOZZ Owner Administration Access Denied',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminUnauthorizedPage() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: 'var(--color-charcoal-card, #16161D)',
          borderRadius: '14px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#EF4444',
            marginBottom: '1.25rem',
          }}
        >
          <ShieldAlert size={28} />
        </div>

        <h1
          style={{
            fontSize: '1.45rem',
            fontWeight: 600,
            color: 'var(--color-ivory, #F6F3EC)',
            marginBottom: '0.75rem',
          }}
        >
          Access Denied
        </h1>

        <p
          style={{
            fontSize: '0.92rem',
            color: 'var(--color-text-dim, #9A9AA8)',
            lineHeight: 1.6,
            marginBottom: '1.5rem',
          }}
        >
          You have signed in with a valid Firebase account, but this user has not been granted
          administrator privileges (custom claim <code style={{ color: 'var(--color-gold-light)' }}>admin: true</code>).
          Public registration is disabled and administrative controls are strictly restricted to the authorized portfolio owner.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SignOutButton label="Sign Out of Session" variant="danger" />

          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              color: 'var(--color-text-muted, #808092)',
              textDecoration: 'none',
              marginTop: '0.5rem',
            }}
          >
            <ArrowLeft size={14} />
            <span>Return to Portfolio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
