import React from 'react';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { siteContentRepository } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';
import { SettingsStudioView } from '@/components/admin/SettingsStudioView';

export const instant = false;

export const metadata: Metadata = {
  title: 'Global Site Settings Management',
  description: 'PHILOZZ Owner Administration — Global Configuration, Feature Toggles & Operational Perimeter',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminSettingsPage() {
  const user = await requireAdminSession();
  const [publishedConfig, draftConfig] = await Promise.all([
    siteContentRepository.getBrandInfo(),
    siteContentRepository.getBrandInfoDraft(),
  ]);

  const hasDraft = Boolean(draftConfig);
  const activeConfig = draftConfig || publishedConfig;
  const dataSource = process.env.CMS_DATA_SOURCE || 'local';

  return (
    <AdminShell
      user={user}
      title="Global Site Settings"
      subtitle="Brand identity, public contact, asset references, and supported runtime features"
    >
      <SettingsStudioView
        initialConfig={activeConfig}
        publishedConfig={publishedConfig}
        hasDraft={hasDraft}
        dataSource={dataSource}
        ownerUid={user.uid}
        ownerEmail={user.email}
      />
    </AdminShell>
  );
}
