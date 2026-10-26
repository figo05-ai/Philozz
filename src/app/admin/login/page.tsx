import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth/requireAdminSession';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export const instant = false;

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'PHILOZZ Owner Administration Sign In',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLoginPage() {
  // If already authenticated as an admin, redirect straight to /admin
  const existingSession = await getAdminSession();
  if (existingSession) {
    redirect('/admin');
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      <AdminLoginForm />
    </div>
  );
}
