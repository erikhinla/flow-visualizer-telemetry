'use client';

import { useEffect, useRef, useState } from 'react';
import { AUDIENCES, PROFILE_WORD, type AudienceId } from '../lib/audiences';
import { BANDS, HOURS_PER_YEAR, RAW_MAX, WEEKS_PER_YEAR, estimate } from '../lib/math';
import { narrative } from '../lib/narrative';
import { stageFor } from '../lib/stage';
import type { scoreMap } from '../lib/questionnaire';
import type { ProfileId } from '../lib/types';
import { KeystonesPrice, checkoutHref, useKeystonesOffer } from './KeystonesPrice';

export const REVIEW_URL = process.env.NEXT_PUBLIC_PROOF_BOOKING_URL || 'https://calendar.app.google/GUyyj5aXpiarDWpg6';
const FRICTION_MODEL_URL = 'https://transformby10x.ai/review/friction-model/index.html';

/** One ladder, used on the result page and in the footer sheet. */
export const LADDER: ReadonlyArray<readonly [string, string]> = [
  ['PROOF', '15 answers. One pattern. The result shows on screen.'],
  ['Context Keystones', 'The BACK (Business Aligned Context Keystones) offer. Built from the 15 answers and a short intake. Downloads right after the intake.'],
  ['Remote mini FACT', 'Reads real handoffs from current work, remotely. $1,750. Call first.'],
  ['FACT', 'On site. Ends with the FACT report (Friction Audit Context Telemetry): where delivery stalls, what it costs, and what to change first. $4,500 plus travel: $2,250 up front, $1,125 on arrival, $1,125 on completion. Call first.'],
]

const PATTERN_LINE: Record<ProfileId, string> = {
  FRAGMENTED: 'People hold the work together. No shared record does.',
  STALLED: 'The work waits in the gaps between steps.',
  SCALING: 'The work moves, but the same context gets rebuilt along the way.',
  COMPOUNDING: 'Most of the work is connected. The goal is keeping it that way as the team grows.',
};

type Score = NonNullable<ReturnType<typeof scoreMap>>;

export function Arrow() {
  return (
    <svg className="px-arrow" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      <path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function BookCta({ note, first = false }: { note: string; first?: boolean }) {
  return (
    <div className="px-actions px-res-cta">
      <a className="px-btn px-btn-light" href={REVIEW_URL} target="_blank" rel="noopener">Book a Mini FACT Call <Arrow /></a>
      {first ? <p className="px-meta px-res-expand">FACT (Friction Audit Context Telemetry)</p> : null}
      <p className="px-meta">{note}</p>
    </div>
  );
}

export function Ladder({ light = false }: { light?: boolean }) {
  return (
    <ol className={light ? 'px-ks-ladder is-light' : 'px-ks-ladder'} aria-label="What happens next">
      {LADDER.map(([name, line], i) => (
        <li key={name} className={i === 0 ? 'is-here' : undefined}>
          <span className="px-no">{String(i + 1).padStart(2, '0')}</span>
          <strong>{name}</strong>
          <em>{line}</em>
        </li>
      ))}
    </ol>
  );
}

export function Result({ audienceId, score, code, restart }: { audienceId: AudienceId; score: Score; restart: () => void; code?: string | null }) {
  const audience = AUDIENCES[audienceId];
  const p0 = score.pressures[0];
  const stage = p0 ? stageFor(audienceId, p0) : null;
  const first = p0 ? audience.pressure[p0] : null;
  const story = narrative({ audienceId, profile: score.profile, pressures: score.pressures, label: (id) => audience.pressure[id] });
  const band = BANDS.find((b) => b.id === score.profile)!;
  const offer = useKeystonesOffer();
  const screens = code ? ['Where work stalls', 'What the answers show', 'Payroll hours', 'Context Keystones', 'What happens next'] : ['Where work stalls', 'What the answers show', 'Payroll hours', 'What happens next'];
  const [step, setStep] = useState(0);
  const [how, setHow] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const last = screens.length - 1;
  const current = screens[step];
  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('h1, h2')?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => {
    if (!how) return;
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setHow(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [how]);

  return (
    <section className="px-result px-res px-res-steps" aria-labelledby="px-done">
      <div className="px-res-panel" ref={panel} key={current}>
        {current === 'Where work stalls' ? (
          <div className="px-res-screen">
            <p className="px-res-label">Result · PROOF</p>
            <h1 id="px-done" className="px-done" tabIndex={-1}>
              <span>Here's where the work stalls.</span>
            </h1>
            <div className="px-res-box">
              <p className="px-res-label">Where work stalls</p>
              <p className="px-res-value px-res-big">{stage ?? 'No single stage'}</p>
              <p className="px-res-sub">{first ? `${first}.` : 'The friction is spread across the route.'}</p>
              <p className="px-res-sub">{PATTERN_LINE[score.profile]}</p>
            </div>
            <BookCta first note="45-minute call. We walk through the result and whether a Mini FACT or a FACT fits." />
          </div>
        ) : null}

        {current === 'What the answers show' ? (
          <div className="px-res-screen">
            <p className="px-res-label">15 answers · {PROFILE_WORD[score.profile]} · {score.raw} of {RAW_MAX}</p>
            <h2 className="px-res-h" tabIndex={-1}>What the answers show</h2>
            <div className="px-res-box">
              <p className="px-res-feel">{audience.profile[score.profile]}</p>
              <p className="px-res-story">{story}</p>
            </div>
            {score.pressures.length ? (
              <div className="px-res-box">
                <p className="px-res-label">Where work stalls</p>
                <ul className="px-res-list">
                  {score.pressures.map((id) => (
                    <li key={id}>{audience.pressure[id]}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {current === 'Payroll hours' ? (
          <div className="px-res-screen">
            <Estimate />
          </div>
        ) : null}

        {current === 'Context Keystones' && code ? (
          <div className="px-res-screen px-prod-wrap">
            <article className="px-prod" aria-labelledby="px-prod-h">
              <div className="px-prod-bar">
                <span>The BACK (Business Aligned Context Keystones) offer</span>
                <span>Built from these 15 answers</span>
              </div>
              <div className="px-prod-body">
                <h2 id="px-prod-h" className="px-prod-name" tabIndex={-1}>Context Keystones</h2>
                <p className="px-prod-fix">The agency&apos;s own tools keep the context, so nobody rebuilds it by hand. Bridge the Context Gap and get back to the work.</p>
                <ul className="px-prod-parts" aria-label="What's inside">
                  <li><span>01 · Folders</span>A structure where the brief, decisions and status live with the work.</li>
                  <li><span>02 · Markdown files</span>The context written down once, readable by people and agents.</li>
                  <li><span>03 · Scripts</span>Small helpers that keep the record current without extra steps.</li>
                  <li><span>04 · Protocols</span>The handoff rules the team follows at the stage where work stalls{stage ? `: ${stage}` : ''}.</li>
                </ul>
                <div className="px-prod-buy">
                  <p className="px-prod-price"><KeystonesPrice offer={offer} /></p>
                  <a className="px-btn px-btn-light px-prod-btn" href={checkoutHref(code)}>Build Context Keystones from these answers <Arrow /></a>
                  <p className="px-meta">Built after a short intake. Downloads right after.</p>
                </div>
              </div>
            </article>
          </div>
        ) : null}

        {current === 'What happens next' ? (
          <div className="px-res-screen">
            <h2 className="px-res-h" tabIndex={-1}>What happens next</h2>
            <div className="px-res-box px-res-next">
              <Ladder />
            </div>
            <BookCta note="45-minute call. No commitment." />
            <p className="px-meta px-res-direct">
              <a href="https://calendar.app.google/4mgKAmouyucz7jk79" target="_blank" rel="noopener">Book a FACT call</a> · on-site scope, dates and travel · <a href="https://transformby10x.ai/offers/">See all offers</a>
            </p>
          </div>
        ) : null}
      </div>

      <nav className="px-res-nav" aria-label="Result screens">
        <button type="button" className="px-res-navbtn" onClick={() => setStep(step - 1)} disabled={step === 0}>← Back</button>
        <span className="px-res-count">
          {String(step + 1).padStart(2, '0')} / {String(screens.length).padStart(2, '0')} · {current}
        </span>
        <span className="px-res-tools">
          <button type="button" className="px-link" onClick={() => setHow(true)}>How we scored this</button>
          <button type="button" className="px-link" onClick={restart}>Retake PROOF</button>
        </span>
        {step < last ? (
          <button type="button" className="px-res-navbtn is-next" onClick={() => setStep(step + 1)}>Next: {screens[step + 1]} →</button>
        ) : (
          <button type="button" className="px-res-navbtn is-next" onClick={() => setStep(0)}>Start over →</button>
        )}
      </nav>

      {how ? (
        <div className="px-res-overlay" onClick={() => setHow(false)}>
          <div className="px-res-how-panel" role="dialog" aria-modal="true" aria-labelledby="px-how-h" onClick={(ev) => ev.stopPropagation()}>
            <div className="px-prod-bar"><span id="px-how-h">How we scored this</span><button type="button" className="px-close" onClick={() => setHow(false)} aria-label="Close">×</button></div>
            <div className="px-res-how-body">
              <p>Each answer is worth 0, 1, or 2 points. The total is {score.raw} of {RAW_MAX}, which reads {PROFILE_WORD[score.profile]} ({band.from} to {band.to}). The bands are 0 to 7 Fragmented, 8 to 14 Stalled, 15 to 22 Scaling, and 23 to 30 Compounding.</p>
              <p>The lowest-scoring answer names the stage where work stalls. {score.allPressures.length ? `${score.allPressures.length} of the answers point to a stage worth a look.` : "None of the answers pointed to one stage."} PROOF doesn't name a department. Finding where work stalls inside the business is Friction Audit work.</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(v);

function Estimate() {
  const [team, setTeam] = useState('');
  const [salary, setSalary] = useState('');
  const [hours, setHours] = useState('');
  const t = Number(team);
  const s = Number(salary);
  const h = Number(hours);
  const ready = t > 0 && s > 0 && h > 0;
  const e = ready ? estimate(t, s, h) : null;
  const field = (label: string, value: string, set: (v: string) => void, placeholder: string, unit?: string) => (
    <label className="px-est-field">
      <span>{label}</span>
      <span className="px-est-input">
        {unit === '$' ? <i>$</i> : null}
        <input type="number" inputMode="decimal" min={0} placeholder={placeholder} value={value} onChange={(ev) => set(ev.target.value)} />
        {unit && unit !== '$' ? <i>{unit}</i> : null}
      </span>
    </label>
  );
  return (
    <section className="px-est" aria-labelledby="px-est-h">
      <div className="px-est-head">
        <h2 id="px-est-h">Payroll hours rebuilding context</h2>
        <p className="px-meta"><a href="https://transformby10x.ai/friction-model" target="_blank" rel="noopener">How it&apos;s calculated</a></p>
        <p>Time cost, not savings or return on investment</p>
      </div>
      <div className="px-est-fields">
        {field('People on the team', team, setTeam, 'e.g. 6', 'people')}
        {field('Average salary', salary, setSalary, 'e.g. 90000', '$')}
        {field('Hours a week each person spends finding, checking, or rebuilding work', hours, setHours, 'e.g. 5', 'h')}
      </div>
      <div aria-live="polite">
        {e ? (
          <>
            <p className="px-est-result">
              That's <b className="px-est-total">{usd0.format(e.annual)}</b> a year in paid time spent repairing context.
            </p>
            <p className="px-est-plain">
              {num(h)} hours × {num(t)} people × {usd2.format(e.hourly)} an hour × {WEEKS_PER_YEAR} weeks.
            </p>
            <details className="px-res-how">
              <summary>Show the math</summary>
              <ol className="px-est-steps">
                <li>
                  <span className="px-eq">Hourly cost = {usd0.format(s)} ÷ {num(HOURS_PER_YEAR)} = <b>{usd2.format(e.hourly)}</b></span>
                  <small>What one paid hour costs. 2,080 is 40 hours over 52 weeks.</small>
                </li>
                <li>
                  <span className="px-eq">Weekly = {num(h)} × {num(t)} × {usd2.format(e.hourly)} = <b>{usd2.format(e.weekly)}</b></span>
                  <small>Paid hours each week spent fixing work that showed up without the brief, file or decision.</small>
                </li>
                <li>
                  <span className="px-eq">Yearly = {usd2.format(e.weekly)} × {WEEKS_PER_YEAR} = <b className="px-est-total">{usd0.format(e.annual)}</b></span>
                  <small>Equal to {num(Math.round(e.salaryShare * 1000) / 10)}% of one {usd0.format(s)} salary.</small>
                </li>
              </ol>
            </details>
          </>
        ) : (
          <p className="px-est-result is-empty">Enter three numbers to see the figure.</p>
        )}
      </div>
      <p className="px-est-note">These hours are an estimate. The figure prices that time, not money saved.</p>
      <p className="px-est-bridge">
        This uses 2 of the 9 Friction Model measures. <a href={FRICTION_MODEL_URL}>FACT measures all 9 on real handoffs.</a>
      </p>
    </section>
  );
}
