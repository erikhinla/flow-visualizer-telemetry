'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { diagnosticsOn, setDiagnostics } from '../lib/telemetry';

const LINKS = [
  { href: '/', label: 'PROOF' },
  { href: '/visualizer', label: 'Desk model' },
  { href: '/record', label: 'Record' },
];

const APP_ROUTES = new Set(['/', '/map']);

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (APP_ROUTES.has(pathname)) {
    return (
      <>
        <a className="skip" href="#proof-stage">
          Skip to content
        </a>
        <main id="content" className="app-main">
          {children}
        </main>
      </>
    );
  }
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
        <p>
          <img className="colophon-mark" src={`${process.env.NEXT_PUBLIC_PROOF_BASE_PATH ?? ''}/brand/tbtx-wordmark-white.png`} alt="TransformBy10X" width={284} height={143} />
          PROOF is 15 answers that show where Digital Friction shows up.</p>
        <p>
          <Link href="/">Back to PROOF</Link> · <Link href="/offer">Talk through the pattern</Link>
        </p>
        <DiagnosticsToggle />
      </footer>
    </>
  );
}

export function DiagnosticsToggle() {
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
