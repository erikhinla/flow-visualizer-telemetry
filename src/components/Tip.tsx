'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Only one tip open at a time across the page. */
const OPEN_EVENT = 'px-tip-open';
const hoverable = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * Small (i) button with a tooltip. Desktop: hover or keyboard focus shows it.
 * Phone: tap toggles a popover. Esc, outside tap, or opening another tip closes it.
 * The text renders in a portal with fixed position so transformed parents never clip it.
 */
export function Tip({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const show = useCallback(() => {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
    setOpen(true);
  }, [id]);
  const hide = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const other = (ev: Event) => { if ((ev as CustomEvent).detail !== id) setOpen(false); };
    window.addEventListener(OPEN_EVENT, other);
    return () => window.removeEventListener(OPEN_EVENT, other);
  }, [id]);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const b = btn.current?.getBoundingClientRect();
      if (!b) return;
      const vw = window.innerWidth;
      const w = Math.min(288, vw - 24);
      const left = Math.max(12, Math.min(b.left + b.width / 2 - w / 2, vw - 12 - w));
      const above = b.bottom + 180 > window.innerHeight && b.top > 180;
      setPos({ left, top: above ? b.top - 8 : b.bottom + 8, above });
    };
    place();
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    const onDown = (ev: PointerEvent) => {
      const t = ev.target as Node;
      if (btn.current?.contains(t) || pop.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  return (
    <span className={`px-tip${className ? ` ${className}` : ''}`} onMouseEnter={() => hoverable() && show()} onMouseLeave={() => hoverable() && hide()}>
      <button
        ref={btn}
        type="button"
        className="px-tip-btn"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(ev) => { ev.stopPropagation(); if (open) hide(); else show(); }}
        onFocus={() => hoverable() && show()}
        onBlur={() => hoverable() && hide()}
      >
        <span aria-hidden="true">i</span>
      </button>
      {mounted && open && pos
        ? createPortal(
            <span
              ref={pop}
              id={id}
              role="tooltip"
              className={`px-tip-pop${pos.above ? ' is-above' : ''}`}
              style={{ left: pos.left, top: pos.top }}
            >
              {children}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
