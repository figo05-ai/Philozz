import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: '404: Page Not Found',
  description: 'The requested engineering resource or page could not be found.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main
      id="main-content"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-obsidian)',
        color: 'var(--color-ivory)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid var(--color-gold-border)',
          borderRadius: '16px',
          padding: '3.5rem 2rem',
          backgroundColor: 'rgba(22, 22, 29, 0.85)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            color: 'var(--color-gold-light)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}
        >
          HTTP 404 // RESOURCE NOT LOCATED
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.4rem, 5vw, 3.2rem)',
            color: 'var(--color-ivory)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '1.25rem',
          }}
        >
          Page Not Found.
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--color-ivory-muted)',
            lineHeight: 1.6,
            marginBottom: '2.5rem',
          }}
        >
          The page or case study you requested does not exist or may have been relocated.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            className="btn-gold"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '8px',
            }}
          >
            <Home size={16} />
            <span>Return to Portfolio</span>
          </Link>

          <Link
            href="/projects"
            className="btn-outline-gold"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '8px',
            }}
          >
            <ArrowLeft size={16} />
            <span>View All Projects</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
