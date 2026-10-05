'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { diagnosticsOn, setDiagnostics } from '../lib/telemetry';

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
        <p>Erik H Bush. One function, last week’s counts, a yes or a no on the fix.</p>
        <p>A client result from this trace is not published yet.</p>
        <p>
          <Link href="/offer">Desk Trace</Link>
        </p>
        <DiagnosticsToggle />
      </footer>
    </>
  );
}

function DiagnosticsToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(diagnosticsOn());
  }, []);
  return (
    <label className="toggle diagnostics">
      <input
        type="checkbox"
        checked={on}
        onChange={(event) => {
          const next = event.target.checked;
          setDiagnostics(next);
          setOn(next);
        }}
      />
      Send anonymous diagnostics. Off until you turn this on. PROOF sends the page and the desk, not
      your numbers.
    </label>
  );
}
