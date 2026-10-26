import React from 'react';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { articleRepository } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';
import { ArticleForm } from '@/components/admin/ArticleForm';

export const instant = false;

export const metadata: Metadata = {
  title: 'Write New Article',
  description: 'PHILOZZ Owner Administration — Create Technical Article & Journal Entry',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminNewArticlePage() {
  const user = await requireAdminSession();
  const categories = await articleRepository.getCategories();

  return (
    <AdminShell
      user={user}
      title="Write New Article"
      subtitle="Author, specify code snippets, and publish an engineering journal entry"
    >
      <ArticleForm mode="create" categories={categories} />
    </AdminShell>
  );
}
