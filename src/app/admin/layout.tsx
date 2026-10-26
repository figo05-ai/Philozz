import React from 'react';
import type { Metadata } from 'next';
import '@/styles/admin.css';

export const metadata: Metadata = {
  title: {
    template: '%s // PHILOZZ Admin',
    default: 'PHILOZZ Admin Console',
  },
  description: 'Authorized administration portal for PHILOZZ.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-obsidian, #0A0A0D)',
        color: 'var(--color-ivory, #F6F3EC)',
        fontFamily: 'var(--font-sans, sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
