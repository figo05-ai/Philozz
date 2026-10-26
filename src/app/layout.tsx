import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono, Caveat } from 'next/font/google';
import './globals.css';

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

import { getPersonAndWebSiteJsonLd, SITE_CONFIG } from '@/lib/seoData';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.name} // ${SITE_CONFIG.role}`,
    template: `%s // ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: [
    'Backend Engineer',
    'System Design',
    'Software Architecture',
    'Laravel',
    'PostgreSQL',
    'MySQL',
    'Redis Queues',
    'React',
    'TypeScript',
    'Docker',
    'PHP 8.3',
  ],
  authors: [{ name: SITE_CONFIG.developerName, url: SITE_CONFIG.url }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} // ${SITE_CONFIG.role}`,
    description: SITE_CONFIG.description,
    images: [
      {
        url: '/images/philozz-cinematic-hero.png',
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.developerName} (${SITE_CONFIG.name}) — ${SITE_CONFIG.role}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} // ${SITE_CONFIG.role}`,
    description: SITE_CONFIG.description,
    images: ['/images/philozz-cinematic-hero.png'],
    creator: '@philozz',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = getPersonAndWebSiteJsonLd();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} ${caveat.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
