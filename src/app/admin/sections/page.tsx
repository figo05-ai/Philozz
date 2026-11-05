import React from 'react';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { siteContentRepository, getRepositoryDataSource } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';
import { SectionsStudioView } from '@/components/admin/SectionsStudioView';

export const instant = false;

export const metadata: Metadata = {
  title: 'Site Sections Studio // PHILOZZ',
  description: 'PHILOZZ Owner Administration — Homepage Editorial Sections & Cinematic Narrative Studio',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminSectionsPage() {
  const user = await requireAdminSession();
  const [
    publishedConfig,
    draftConfig,
    brandInfo,
    technologies,
    orbitSlotsDraft,
    orbitSlotsPublished,
    expertiseAreas,
  ] = await Promise.all([
    siteContentRepository.getHomepageConfig(),
    siteContentRepository.getHomepageConfigDraft(),
    siteContentRepository.getBrandInfo(),
    siteContentRepository.getAllTechnologies(),
    siteContentRepository.getOrbitSlotsDraft(),
    siteContentRepository.getOrbitSlots(),
    siteContentRepository.getAllExpertiseAreas(),
  ]);

  const dataSource = getRepositoryDataSource();

  return (
    <AdminShell
      user={user}
      title="Site Sections Studio"
      subtitle="Full content management for Hero, About, Skills Galaxy, Disciplines, Contact, Footer, and Brand identity"
    >
      <SectionsStudioView
        initialConfig={draftConfig || publishedConfig}
        publishedConfig={publishedConfig}
        brandInfo={brandInfo}
        hasDraft={Boolean(draftConfig)}
        dataSource={dataSource}
        initialTechnologies={technologies}
        initialOrbitSlotsDraft={orbitSlotsDraft}
        initialOrbitSlotsPublished={orbitSlotsPublished}
        initialExpertiseAreas={expertiseAreas}
      />
    </AdminShell>
  );
}
