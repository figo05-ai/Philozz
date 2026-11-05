import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { articleRepository } from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';
import { ArticleForm } from '@/components/admin/ArticleForm';

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await articleRepository.getById(id, { includeDeleted: true });

  return {
    title: article ? `Edit: ${article.title}` : 'Edit Article',
    description: 'PHILOZZ Owner Administration — Edit Engineering Article',
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function AdminEditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminSession();
  const { id } = await params;

  const [article, categories] = await Promise.all([
    articleRepository.getById(id, { includeDeleted: true }),
    articleRepository.getCategories(),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <AdminShell
      user={user}
      title={`Edit: ${article.title}`}
      subtitle={`Configure article sections, technical code blocks, and live status (ID: ${article.id})`}
    >
      <ArticleForm mode="edit" initialArticle={article} categories={categories} />
    </AdminShell>
  );
}
