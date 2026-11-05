import React from 'react';
import { CheckCircle2, Clock, Archive, Sparkles } from 'lucide-react';

export type StatusType = 'published' | 'draft' | 'archived' | 'featured' | string;

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
}

export function StatusIndicator({
  status,
  label,
  size = 'md',
}: StatusIndicatorProps) {
  const normalized = status.toLowerCase();

  let bg = 'rgba(128, 128, 146, 0.12)';
  let border = 'rgba(128, 128, 146, 0.3)';
  let text = 'var(--color-text-dim, #9A9AA8)';
  let dotColor = '#808092';
  let IconComponent: React.ComponentType<{ size: number }> | null = null;
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  if (normalized === 'published') {
    bg = 'rgba(16, 185, 129, 0.12)';
    border = 'rgba(16, 185, 129, 0.35)';
    text = '#34D399';
    dotColor = '#10B981';
    IconComponent = CheckCircle2;
  } else if (normalized === 'draft') {
    bg = 'rgba(245, 158, 11, 0.12)';
    border = 'rgba(245, 158, 11, 0.35)';
    text = '#FBBF24';
    dotColor = '#F59E0B';
    IconComponent = Clock;
  } else if (normalized === 'archived') {
    bg = 'rgba(128, 128, 146, 0.12)';
    border = 'rgba(128, 128, 146, 0.3)';
    text = '#9A9AA8';
    dotColor = '#808092';
    IconComponent = Archive;
  } else if (normalized === 'featured') {
    bg = 'rgba(201, 164, 92, 0.14)';
    border = 'rgba(201, 164, 92, 0.4)';
    text = 'var(--color-gold-light, #E4C88A)';
    dotColor = 'var(--color-gold, #C9A45C)';
    IconComponent = Sparkles;
  }

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '0.35rem' : '0.45rem',
        padding: isSmall ? '0.2rem 0.55rem' : '0.3rem 0.75rem',
        borderRadius: '9999px',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color: text,
        fontSize: isSmall ? '0.72rem' : '0.78rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
      aria-label={`Status: ${displayLabel}`}
    >
      {IconComponent ? (
        <IconComponent size={isSmall ? 11 : 13} />
      ) : (
        <span
          style={{
            width: isSmall ? '5px' : '6px',
            height: isSmall ? '5px' : '6px',
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0,
          }}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
