'use client';

import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInOwner } from '@/lib/auth/firebaseClient';

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // 1. Client-side authentication with Firebase
      const authResult = await signInOwner(email, password);
      if (!authResult.success || !authResult.idToken) {
        setErrorMessage(authResult.error || 'Invalid email or password.');
        setIsSubmitting(false);
        return;
      }

      // 2. Exchange fresh ID token for secure server session cookie
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: authResult.idToken }),
      });

      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok || !sessionData.success) {
        setErrorMessage(
          sessionData.error || 'Access denied: verified owner authorization failed.'
        );
        setIsSubmitting(false);
        return;
      }

      // 3. Navigate to /admin and refresh server state
      router.push('/admin');
      router.refresh();
    } catch {
      setErrorMessage('Network error during authentication. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '440px',
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 2rem',
        backgroundColor: 'var(--color-charcoal-card, #16161D)',
        borderRadius: '14px',
        border: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.22))',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px var(--color-gold-glow, rgba(201, 164, 92, 0.1))',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(201, 164, 92, 0.1)',
            border: '1px solid var(--color-gold, #C9A45C)',
            color: 'var(--color-gold-light, #E4C88A)',
            marginBottom: '1rem',
          }}
        >
          <Lock size={22} />
        </div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--color-ivory, #F6F3EC)',
            letterSpacing: '0.02em',
            marginBottom: '0.35rem',
          }}
        >
          PHILOZZ Admin
        </h1>
        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--color-text-dim, #9A9AA8)',
          }}
        >
          Authorized owner access verification
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '8px',
            color: '#FCA5A5',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            marginBottom: '1.5rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="admin-email"
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--color-ivory-muted, #D2CEC4)',
              marginBottom: '0.5rem',
            }}
          >
            Owner Email
          </label>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '0.9rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted, #808092)',
                pointerEvents: 'none',
                display: 'flex',
              }}
            >
              <Mail size={16} />
            </div>
            <input
              id="admin-email"
              type="email"
              name="email"
              autoComplete="username"
              required
              disabled={isSubmitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@philozz.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.6rem',
                backgroundColor: 'rgba(10, 10, 13, 0.75)',
                border: '1px solid rgba(201, 164, 92, 0.25)',
                borderRadius: '8px',
                color: 'var(--color-ivory, #F6F3EC)',
                fontSize: '0.92rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold, #C9A45C)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(201, 164, 92, 0.25)')}
            />
          </div>
        </div>

        {/* Password Field */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label
            htmlFor="admin-password"
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--color-ivory-muted, #D2CEC4)',
              marginBottom: '0.5rem',
            }}
          >
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '0.9rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted, #808092)',
                pointerEvents: 'none',
                display: 'flex',
              }}
            >
              <Lock size={16} />
            </div>
            <input
              id="admin-password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.6rem',
                backgroundColor: 'rgba(10, 10, 13, 0.75)',
                border: '1px solid rgba(201, 164, 92, 0.25)',
                borderRadius: '8px',
                color: 'var(--color-ivory, #F6F3EC)',
                fontSize: '0.92rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold, #C9A45C)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(201, 164, 92, 0.25)')}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '0.85rem 1.25rem',
            backgroundColor: isSubmitting ? 'var(--color-gold-dark, #A37E36)' : 'var(--color-gold, #C9A45C)',
            border: 'none',
            borderRadius: '8px',
            color: '#0A0A0D',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            transition: 'background-color 0.2s ease, transform 0.15s ease',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In to Admin</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Security Notice */}
      <div
        style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(201, 164, 92, 0.12)',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--color-text-muted, #808092)',
        }}
      >
        <span>Protected admin boundary • Firebase session authentication</span>
      </div>
    </div>
  );
}
