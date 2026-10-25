'use client';

import React from 'react';

interface FallbackViewProps {
  isWebGLDisabled: boolean;
}

export function FallbackView({ isWebGLDisabled }: FallbackViewProps) {
  if (!isWebGLDisabled) return null;

  return (
    <div
      role="region"
      aria-label="High-Accessibility Display Mode Active"
      className="fallback-banner"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99,
        background: 'var(--color-charcoal)',
        color: 'var(--color-gold-light)',
        padding: '10px 16px',
        borderRadius: '8px',
        border: '1px solid var(--color-gold)',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        letterSpacing: '0.04em',
      }}
    >
      <span>WEBGL_FALLBACK: ACTIVE (HTML/CSS LUXURY MODE)</span>
    </div>
  );
}
