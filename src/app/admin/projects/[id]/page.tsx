import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { projectRepository } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';
import { ProjectForm } from '@/components/admin/ProjectForm';

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await projectRepository.getById(id, { includeDeleted: true });

  return {
    title: project ? `Edit: ${project.title}` : 'Edit Project',
    description: 'PHILOZZ Owner Administration — Edit Project & Case Study',
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function AdminEditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminSession();
  const { id } = await params;

  const project = await projectRepository.getById(id, { includeDeleted: true });
  if (!project) {
    notFound();
  }

  return (
    <AdminShell
      user={user}
      title={`Edit: ${project.title}`}
      subtitle={`Configure case study architecture, technical decisions, and live status (ID: ${project.id})`}
    >
      <ProjectForm mode="edit" initialProject={project} />
    </AdminShell>
  );
}
