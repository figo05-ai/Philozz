import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { ProjectsArchiveView } from '@/components/ProjectsArchiveView';
import { BRAND_INFO } from '@/data/portfolioData';

export const metadata: Metadata = {
  title: `Project Archive // ${BRAND_INFO.name}`,
  description:
    'A collection of verified software systems, backend architectures, desktop hardware runtimes, and distributed queue systems.',
};

function ArchiveLoadingFallback() {
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
      LOADING_ARCHIVE // PHILOZZ...
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ArchiveLoadingFallback />}>
      <ProjectsArchiveView />
    </Suspense>
  );
}
