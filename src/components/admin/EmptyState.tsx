import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  footnote?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  footnote,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem',
        borderRadius: '12px',
        backgroundColor: 'rgba(22, 22, 29, 0.5)',
        border: '1px dashed var(--color-gold-border, rgba(201, 164, 92, 0.22))',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: 'rgba(201, 164, 92, 0.08)',
          border: '1px solid rgba(201, 164, 92, 0.2)',
          color: 'var(--color-gold, #C9A45C)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <Icon size={24} />
      </div>

      <h3
        style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          color: 'var(--color-ivory, #F6F3EC)',
          marginBottom: '0.4rem',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.86rem',
          color: 'var(--color-text-dim, #9A9AA8)',
          maxWidth: '460px',
          lineHeight: 1.5,
          marginBottom: footnote ? '0.75rem' : 0,
        }}
      >
        {description}
      </p>

      {footnote && (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted, #808092)',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          {footnote}
        </span>
      )}
    </div>
  );
}
