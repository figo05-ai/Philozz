import React from 'react';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { articleRepository, getRepositoryDataSource } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';
import { ArticlesStudioView } from '@/components/admin/ArticlesStudioView';

export const instant = false;

export const metadata: Metadata = {
  title: 'Blog Studio',
  description: 'PHILOZZ Owner Administration — Engineering Journal & Technical Writeups Studio',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminArticlesPage() {
  const user = await requireAdminSession();
  const [articles, categories] = await Promise.all([
    articleRepository.getAll({ includeDeleted: true }),
    articleRepository.getCategories(),
  ]);
  const dataSource = getRepositoryDataSource();

  return (
    <AdminShell
      user={user}
      title="Engineering Journal Studio"
      subtitle="Complete owner CRUD management for technical essays, query optimizations, and notes"
    >
      <ArticlesStudioView
        initialArticles={articles}
        initialCategories={categories}
        dataSource={dataSource}
      />
    </AdminShell>
  );
}

