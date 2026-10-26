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
import { siteContentRepository } from '@/cms/repositories';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const [seoConfig, brandInfo] = await Promise.all([
    siteContentRepository.getSeoConfig(),
    siteContentRepository.getBrandInfo(),
  ]);

  const siteTitle = seoConfig.siteTitle || `${brandInfo.name || SITE_CONFIG.name} // ${brandInfo.role || SITE_CONFIG.role}`;
  const titleTemplate = seoConfig.titleTemplate || `%s // ${brandInfo.name || SITE_CONFIG.name}`;
  const description = seoConfig.defaultDescription || SITE_CONFIG.description;
  const ogImage = seoConfig.defaultOgImage || '/images/philozz-cinematic-hero.png';
  const authorName = brandInfo.developerName || SITE_CONFIG.developerName;
  const brandName = brandInfo.name || SITE_CONFIG.name;
  const roleName = brandInfo.role || SITE_CONFIG.role;

  return {
    metadataBase: new URL(SITE_CONFIG.url),
    title: {
      default: siteTitle,
      template: titleTemplate,
    },
    description,
    keywords: seoConfig.defaultKeywords || [
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
    authors: [{ name: authorName, url: SITE_CONFIG.url }],
    creator: brandName,
    publisher: brandName,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: seoConfig.locale || SITE_CONFIG.locale,
      url: SITE_CONFIG.url,
      siteName: brandName,
      title: siteTitle,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${authorName} (${brandName}) — ${roleName}`,
        },
      ],
    },
    twitter: {
      card: seoConfig.twitterCard || 'summary_large_image',
      title: siteTitle,
      description,
      images: [ogImage],
      creator: seoConfig.twitterCreator || '@philozz',
    },
    robots: {
      index: seoConfig.allowIndexing,
      follow: true,
      googleBot: {
        index: seoConfig.allowIndexing,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [seoConfig, brandInfo] = await Promise.all([
    siteContentRepository.getSeoConfig(),
    siteContentRepository.getBrandInfo(),
  ]);

  const jsonLd = getPersonAndWebSiteJsonLd(brandInfo, seoConfig);

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
