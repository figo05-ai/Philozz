import React from 'react';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { mediaRepository } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';
import { MediaLibraryView } from '@/components/admin/MediaLibraryView';
import { MediaUsageResolver } from '@/cms/media/mediaUsageResolver';
import { getActiveStorageProvider } from '@/cms/media/mediaStorageProvider';
import type { MediaUsageReport } from '@/cms/models/media';

export const instant = false;

export const metadata: Metadata = {
  title: 'Media Library Studio',
  description: 'PHILOZZ Owner Administration — Digital Asset Repository & Safe Storage Provider Pipeline',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminMediaPage() {
  const user = await requireAdminSession();
  const assets = await mediaRepository.getAll({ includeDeleted: true });

  // Resolve active usage references across all content
  const usageResultsMap = await MediaUsageResolver.resolveAllUsage(assets);
  const initialUsageMap: Record<string, MediaUsageReport> = {};
  usageResultsMap.forEach((report, id) => {
    initialUsageMap[id] = report;
  });

  const provider = getActiveStorageProvider();

  return (
    <AdminShell
      user={user}
      title="Media Library Studio"
      subtitle="Digital asset inventory, live usage resolution, and provider-independent storage architecture"
    >
      <MediaLibraryView
        initialAssets={assets}
        initialUsageMap={initialUsageMap}
        activeProvider={provider.providerName}
        isUploadConfigured={provider.isUploadConfigured}
        ownerUid={user.uid}
      />
    </AdminShell>
  );
}
