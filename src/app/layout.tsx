import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Archivo, Barlow, Barlow_Condensed, IBM_Plex_Mono } from 'next/font/google';
import { SessionProvider } from '../components/SessionProvider';
import { Shell } from '../components/Shell';
import './globals.css';
import './proof.css';

const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
});

const sans = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-sans',
});

const grotesk = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-grotesk',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'PROOF · See where Digital Friction shows up',
  description:
    'AI was meant to help your team. Now your team helps the AI. AI sped up the work, but context still gets carried by hand. 15 answers map the route, show where fog and friction stall it, and get your people back to the work they were hired for. Free, from TransformBy10X.',
  ...(process.env.NEXT_PUBLIC_PROOF_NOINDEX ? { robots: { index: false, follow: false } } : {}),
};

export const viewport: Viewport = {
  themeColor: '#121416',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${grotesk.variable} ${mono.variable}`}>
      <body>
        <SessionProvider>
          <Shell>{children}</Shell>
        </SessionProvider>
      </body>
    </html>
  );
}
