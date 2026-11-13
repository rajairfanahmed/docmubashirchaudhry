import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { PreFooterCta } from '@/components/layout/PreFooterCta';
import { Footer } from '@/components/layout/Footer';
import { RouteChromeGate } from '@/components/layout/RouteChromeGate';
import { JsonLd } from '@/components/seo/JsonLd';
import { DEFAULT_OG_IMAGE_PATH, SITE_NAME, SITE_URL } from '@/lib/seo/metadata';
import { buildRootSchema } from '@/lib/seo/structured-data';

const plusJakartaSans = localFont({
  src: './fonts/plus-jakarta-sans-latin.woff2',
  weight: '600 700',
  variable: '--font-jakarta',
  display: 'swap',
  adjustFontFallback: 'Arial'
});

const inter = localFont({
  src: './fonts/inter-latin.woff2',
  weight: '400 700',
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: 'Arial'
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F7F8F5'
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Free Competitive Exam Preparation Portal`,
    template: `%s | ${SITE_NAME}`
  },
  description:
    'Notes, MCQs, quizzes, practice material and other useful resources, all in one place for PPSC and FPSC aspirants.',
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
  verification: {
    google: 'cyPaDLlCl9e3xk1KzdznBwXvizColXpowGUNSc2M4Ws'
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.svg',
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
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
        <head>
          <link rel="dns-prefetch" href="https://img.logo.dev" />
          <link rel="dns-prefetch" href="https://flagcdn.com" />
          <JsonLd data={buildRootSchema()} />
        </head>
        <body className="bg-[var(--color-page)] text-[var(--color-ink)] antialiased min-h-screen flex flex-col justify-between overflow-x-clip selection:bg-[var(--color-accent)] selection:text-[var(--color-accent-ink)]">
          <Providers>
            <div id="dmc-app-shell" className="flex-1 flex flex-col justify-between min-h-screen">
              <RouteChromeGate>
                <Navbar />
              </RouteChromeGate>
              <main id="main-content" role="main" className="flex-1 w-full">
                {children}
              </main>
              <RouteChromeGate hideOnPractice>
                <PreFooterCta />
              </RouteChromeGate>
              <RouteChromeGate>
                <Footer />
              </RouteChromeGate>
            </div>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
