'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import type { AdminUser } from '@/lib/auth/session';

interface MobileAdminNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser;
}

export function MobileAdminNavigation({
  isOpen,
  onClose,
  user,
}: MobileAdminNavigationProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="admin-mobile-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Drawer"
    >
      <div
        className="admin-mobile-drawer"
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative' }}
      >
        <button
          onClick={onClose}
          aria-label="Close navigation menu"
          className="admin-btn-touch"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            zIndex: 10,
            background: 'none',
            border: 'none',
            color: 'var(--color-text-dim, #9A9AA8)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '6px',
          }}
        >
          <X size={20} />
        </button>

        <AdminSidebar user={user} onNavigate={onClose} />
      </div>
    </div>
  );
}
