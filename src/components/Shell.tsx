'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const LINKS = [
  { href: '/map', label: 'Map' },
  { href: '/visualizer', label: 'Follow' },
  { href: '/record', label: 'Record' },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="shell">
        <Link className="wordmark" href="/">
          <span>FLOW</span>
          Visualizer
        </Link>
        <nav aria-label="Primary">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main id="content">{children}</main>
      <footer className="colophon">
        <p>When AI outpaces infrastructure, you get Digital Fog.</p>
        <p>Scenario math is labeled. It does not, by itself, measure a company.</p>
      </footer>
    </>
  );
}
