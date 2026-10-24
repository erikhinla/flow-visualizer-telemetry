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
    "AI tools work. That's not the problem. AI tools increase output, but context doesn't keep up, so humans fill the gap. 15 answers map the route and show where the work stalls. So no one has to spend hours coordinating context. From TransformBy10X.",
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
