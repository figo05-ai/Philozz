import React from 'react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant?: 'gold' | 'emerald' | 'slate';
  };
  href?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  href,
}: StatCardProps) {
  let badgeBg = 'rgba(201, 164, 92, 0.12)';
  let badgeColor = 'var(--color-gold-light, #E4C88A)';
  let badgeBorder = 'rgba(201, 164, 92, 0.25)';

  if (badge?.variant === 'emerald') {
    badgeBg = 'rgba(16, 185, 129, 0.12)';
    badgeColor = '#34D399';
    badgeBorder = 'rgba(16, 185, 129, 0.25)';
  } else if (badge?.variant === 'slate') {
    badgeBg = 'rgba(128, 128, 146, 0.12)';
    badgeColor = '#9A9AA8';
    badgeBorder = 'rgba(128, 128, 146, 0.25)';
  }

  const CardContent = (
    <div
      className="admin-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        position: 'relative',
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--color-text-dim, #9A9AA8)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>

        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'rgba(201, 164, 92, 0.1)',
            border: '1px solid rgba(201, 164, 92, 0.25)',
            color: 'var(--color-gold, #C9A45C)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={19} />
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            color: 'var(--color-ivory, #F6F3EC)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: '0.4rem',
            fontFamily: 'var(--font-sans, sans-serif)',
          }}
        >
          {value}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {subtitle && (
            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-text-muted, #808092)',
              }}
            >
              {subtitle}
            </span>
          )}

          {badge && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: badgeBg,
                color: badgeColor,
                border: `1px solid ${badgeBorder}`,
              }}
            >
              {badge.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
