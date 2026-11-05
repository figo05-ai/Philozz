'use client';

import React, { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SignOutButtonProps {
  label?: string;
  variant?: 'outline' | 'danger';
}

export function SignOutButton({ label = 'Sign Out', variant = 'outline' }: SignOutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  const isDanger = variant === 'danger';

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.65rem 1.15rem',
        backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
        border: isDanger
          ? '1px solid rgba(239, 68, 68, 0.35)'
          : '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.22))',
        borderRadius: '8px',
        color: isDanger ? '#FCA5A5' : 'var(--color-gold-light, #E4C88A)',
        fontSize: '0.88rem',
        fontWeight: 500,
        cursor: isSigningOut ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!isSigningOut) {
          e.currentTarget.style.borderColor = isDanger
            ? '#EF4444'
            : 'var(--color-gold, #C9A45C)';
          e.currentTarget.style.backgroundColor = isDanger
            ? 'rgba(239, 68, 68, 0.2)'
            : 'rgba(201, 164, 92, 0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSigningOut) {
          e.currentTarget.style.borderColor = isDanger
            ? 'rgba(239, 68, 68, 0.35)'
            : 'var(--color-gold-border, rgba(201, 164, 92, 0.22))';
          e.currentTarget.style.backgroundColor = isDanger
            ? 'rgba(239, 68, 68, 0.12)'
            : 'transparent';
        }
      }}
    >
      {isSigningOut ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Signing Out...</span>
        </>
      ) : (
        <>
          <LogOut size={16} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
