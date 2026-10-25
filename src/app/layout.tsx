import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono, Caveat } from 'next/font/google';
import './globals.css';
import { BRAND_INFO } from '@/data/portfolioData';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-script',
  display: 'swap',
});

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
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} ${caveat.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
