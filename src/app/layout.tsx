import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, IBM_Plex_Mono, Outfit } from 'next/font/google';
import { SessionProvider } from '../components/SessionProvider';
import { Shell } from '../components/Shell';
import './globals.css';

const serif = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});

const sans = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'PROOF — where, what, who, when',
  description:
    'An agency trace for the four facts a job needs, and a path to rebuild them on Folders, Markdown, Scripts, and Protocols.',
};

export const viewport: Viewport = {
  themeColor: '#141311',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <SessionProvider>
          <Shell>{children}</Shell>
        </SessionProvider>
      </body>
    </html>
  );
}
