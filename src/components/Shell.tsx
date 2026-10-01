'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const LINKS = [
  { href: '/map', label: 'Scan' },
  { href: '/visualizer', label: 'Trace' },
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
          <span>PROOF</span>
          Agency scan
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
        <p>
          Digital fog hides where the project is, what needs done, who has it, and by when. Digital
          friction is the drag that stalls the desk.
        </p>
        <p>Reconstruction is not the craft. The client decision and the required review stay.</p>
      </footer>
    </>
  );
}
