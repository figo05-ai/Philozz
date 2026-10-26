import React from 'react';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import {
  siteContentRepository,
  projectRepository,
  articleRepository,
} from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';
import { SeoStudioView } from '@/components/admin/SeoStudioView';

export const instant = false;

export const metadata: Metadata = {
  title: 'SEO Management Studio',
  description: 'PHILOZZ Owner Administration — Search Indexing, Metadata Layer & Social Graph Studio',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminSeoPage() {
  const user = await requireAdminSession();

  const [publishedConfig, draftConfig, brandInfo, projects, articles] = await Promise.all([
    siteContentRepository.getSeoConfig(),
    siteContentRepository.getSeoConfigDraft(),
    siteContentRepository.getBrandInfo(),
    projectRepository.getAll({ status: 'published' }),
    articleRepository.getAll({ status: 'published' }),
  ]);

  const hasDraft = draftConfig !== null;
  const initialConfig = draftConfig || publishedConfig;
  const dataSource =
    process.env.NEXT_PUBLIC_CMS_DATA_SOURCE === 'firestore'
      ? 'Cloud Firestore'
      : 'Local Memory Repository';

  return (
    <AdminShell
      user={user}
      title="SEO Management Studio"
      subtitle="Search indexing policy, metadata layer, and social sharing configuration"
    >
      <SeoStudioView
        initialConfig={initialConfig}
        publishedConfig={publishedConfig}
        brandInfo={brandInfo}
        hasDraft={hasDraft}
        dataSource={dataSource}
        totalProjects={projects.length}
        totalArticles={articles.length}
      />
    </AdminShell>
  );
}
