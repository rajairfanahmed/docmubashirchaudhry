import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { StandingTrustNotice } from '@/components/layout/StandingTrustNotice';
import { PreFooterCta } from '@/components/layout/PreFooterCta';
import { Footer } from '@/components/layout/Footer';
import { JsonLd } from '@/components/seo/JsonLd';
import { DEFAULT_OG_IMAGE_PATH, SITE_NAME, SITE_URL } from '@/lib/seo/metadata';
import { buildRootSchema } from '@/lib/seo/structured-data';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
  adjustFontFallback: true
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: true
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0D4A28'
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Free Competitive Exam Preparation Portal`,
    template: `%s | ${SITE_NAME}`
  },
  description:
    'Independent, free competitive exam preparation portal for PPSC, CSS/PMS, FPSC, and NTS aspirants. Practice World Geography, browse verified post blueprints, and download solved MCQ booklets.',
  keywords: [
    'docmubashirchaudhry',
    'Doc Mubashir Chaudhry',
    'PPSC MCQs',
    'PPSC Intelligence Officer',
    'PPSC Intelligent Officer',
    'Tehsil Sports Officer PPSC',
    'CSS PMS Preparation',
    'World Geography Quiz',
    'Country Capitals',
    'World Currencies',
    'One Paper MCQs'
  ],
  authors: [{ name: 'Doc Mubashir Chaudhry' }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg'
  },
  openGraph: {
    title: `${SITE_NAME} | Free Competitive Exam Preparation Portal`,
    description:
      'Independent, free competitive exam preparation portal for PPSC, CSS/PMS, FPSC, and NTS aspirants.',
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} Free Competitive Exam Preparation Portal`
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Free Competitive Exam Preparation Portal`,
    description:
      'Independent, free competitive exam preparation portal for PPSC, CSS/PMS, FPSC, and NTS aspirants.',
    images: [`${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <head>
        <JsonLd data={buildRootSchema()} />
      </head>
      <body className="bg-[var(--dmc-surface-ground)] text-[var(--dmc-ink-primary)] antialiased min-h-screen flex flex-col justify-between overflow-x-clip selection:bg-emerald-100 selection:text-emerald-900">
        <Providers>
          <Navbar />
          <StandingTrustNotice variant="bar" />
          <main id="main-content" role="main" className="flex-1 w-full">
            {children}
          </main>
          <PreFooterCta />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
