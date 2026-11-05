import React from 'react';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { projectRepository, getRepositoryDataSource } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';
import { ProjectsStudioView } from '@/components/admin/ProjectsStudioView';

export const instant = false;

export const metadata: Metadata = {
  title: 'Projects Studio',
  description: 'PHILOZZ Owner Administration — Projects & Case Studies Studio',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminProjectsPage() {
  const user = await requireAdminSession();
  const projects = await projectRepository.getAll({ includeDeleted: true });
  const dataSource = getRepositoryDataSource();

  return (
    <AdminShell
      user={user}
      title="Projects Studio"
      subtitle="Complete owner CRUD management for portfolio case studies and architectures"
    >
      <ProjectsStudioView initialProjects={projects} dataSource={dataSource} />
    </AdminShell>
  );
}

