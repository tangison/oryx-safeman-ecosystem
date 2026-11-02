import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import SiteFooter from '@/components/site-footer';

/**
 * Brand typography — self-hosted with next/font/local.
 *  Radley (serif)  → headings / display only.
 *  Inter (sans)    → body, tables, UI, labels AND all numerals.
 */
const radley = localFont({
  src: [
    { path: '../fonts/Radley-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/Radley-Italic.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--font-radley',
  display: 'swap',
});

const inter = localFont({
  src: [
    { path: '../fonts/Inter_24pt-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/Inter_24pt-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../fonts/Inter_24pt-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../fonts/Inter_24pt-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Oryx Ecosystem — SafeMan™ & Oryx Institute',
    template: '%s — Oryx Ecosystem',
  },
  description:
    'Two competency tracks, one institute: the SafeMan™ Site Safety Passport for industry, and the Oryx Institute NQF Levels 1–7 vocational programmes — plus a public, offline-capable QR credential verification portal.',
  icons: {
    icon: '/assets/logos/safeman_shield_logo_color.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${radley.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-oryx-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
