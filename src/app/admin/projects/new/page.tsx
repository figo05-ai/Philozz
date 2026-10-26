import React from 'react';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { AdminShell } from '@/components/admin/AdminShell';
import { ProjectForm } from '@/components/admin/ProjectForm';

export const instant = false;

export const metadata: Metadata = {
  title: 'Create Project',
  description: 'PHILOZZ Owner Administration — Create New Project & Case Study',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminNewProjectPage() {
  const user = await requireAdminSession();

  return (
    <AdminShell
      user={user}
      title="Create New Project"
      subtitle="Architect, specify, and publish a new engineering case study"
    >
      <ProjectForm mode="create" />
    </AdminShell>
  );
}
