import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { BlogArchiveView } from '@/components/BlogArchiveView';
import { BRAND_INFO } from '@/data/portfolioData';

export const metadata: Metadata = {
  title: `Engineering Journal // ${BRAND_INFO.name}`,
  description:
    'Engineering notes, technical explorations, query plan optimizations, and lessons learned while building real software.',
};

function BlogArchiveLoadingFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-obsidian)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-gold-light)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.9rem',
        letterSpacing: '0.08em',
      }}
    >
      LOADING_JOURNAL // PHILOZZ...
    </div>
  );
}

export default function BlogArchivePage() {
  return (
    <Suspense fallback={<BlogArchiveLoadingFallback />}>
      <BlogArchiveView />
    </Suspense>
  );
}
