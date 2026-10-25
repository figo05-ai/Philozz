import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BRAND_INFO } from '@/data/portfolioData';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: `${BRAND_INFO.name} // ${BRAND_INFO.role}`,
  description: BRAND_INFO.statement,
  keywords: [
    'Backend Engineer',
    'System Design',
    'Software Architecture',
    'Laravel',
    'PostgreSQL',
    'Redis Queues',
    'React',
    'TypeScript',
  ],
  authors: [{ name: BRAND_INFO.name }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
