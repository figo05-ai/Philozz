'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { MobileAdminNavigation } from './MobileAdminNavigation';
import type { AdminUser } from '@/lib/auth/session';

interface AdminShellProps {
  user: AdminUser;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AdminShell({
  user,
  title,
  subtitle,
  children,
}: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="admin-shell">
      {/* Desktop Sidebar (Fixed) */}
      <aside className="admin-sidebar" aria-label="Desktop Admin Navigation">
        <AdminSidebar user={user} />
      </aside>

      {/* Mobile Drawer */}
      <MobileAdminNavigation
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        user={user}
      />

      {/* Main Content Area */}
      <div className="admin-main-wrap">
        <AdminHeader
          onMenuToggle={() => setMobileNavOpen(true)}
          user={user}
          title={title}
          subtitle={subtitle}
        />

        <main className="admin-content-container">
          {children}
        </main>
      </div>
    </div>
  );
}
