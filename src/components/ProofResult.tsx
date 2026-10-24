'use client';

import { useState } from 'react';
import { AUDIENCES, PROFILE_WORD, type AudienceId } from '../lib/audiences';
import { BANDS, HOURS_PER_YEAR, RAW_MAX, WEEKS_PER_YEAR, estimate } from '../lib/math';
import { narrative } from '../lib/narrative';
import { stageFor } from '../lib/stage';
import type { scoreMap } from '../lib/questionnaire';
import type { ProfileId } from '../lib/types';
import { KeystonesPreview } from './KeystonesPreview';
import { KeystonesPrice, checkoutHref, useKeystonesOffer } from './KeystonesPrice';

export const REVIEW_URL = process.env.NEXT_PUBLIC_PROOF_BOOKING_URL || 'https://calendar.app.google/GUyyj5aXpiarDWpg6';
const FRICTION_MODEL_URL = 'https://transformby10x.ai/review/friction-model/index.html';

/** One ladder, used on the result page and in the footer sheet. */
export const LADDER: ReadonlyArray<readonly [string, string]> = [
  ['PROOF', '15 answers. One pattern. The result shows on screen.'],
  ['Context Keystones', 'The BACK offer. Built from the 15 answers and a short intake. Downloads right after the intake.'],
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

function BookCta({ note }: { note: string }) {
  return (
    <div className="px-actions px-res-cta">
      <a className="px-btn px-btn-light" href={REVIEW_URL} target="_blank" rel="noopener">Book a mini FACT call <Arrow /></a>
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

  return (
    <section className="px-result px-res" aria-labelledby="px-done">
      <div className="px-res-col">
        <h1 id="px-done" className="px-done" tabIndex={-1}>
          <span>Here's where the work stalls.</span>
        </h1>
        <p className="px-res-sub">15 answers point to {stage ?? 'no single stage'}.</p>
        <p className="px-res-sub">{PATTERN_LINE[score.profile]}</p>

        <div className="px-res-facts">
          <div>
            <p className="px-res-label">Stall point</p>
            <p className="px-res-value">{stage ?? 'None stood out'}</p>
            <p className="px-res-sub">{first ? `${first}.` : 'The friction is spread across the route.'}</p>
            <BookCta note="45-minute call. We walk through the result and whether a mini FACT or FACT fits." />
          </div>
          <div>
            <p className="px-res-label">What the answers show</p>
            <p className="px-res-sub px-res-feel">{audience.profile[score.profile]}</p>
          </div>
        </div>

        <details className="px-res-how">
          <summary>How we scored this</summary>
          <p>
            Each answer is worth 0, 1, or 2 points. The total is {score.raw} of {RAW_MAX}, which reads {PROFILE_WORD[score.profile]} ({band.from} to {band.to}). The bands are 0 to 7 Fragmented, 8 to 14 Stalled, 15 to 22 Scaling, and 23 to 30 Compounding.
          </p>
          <p>
            The stall point is the stage of work named by the lowest-scoring answer. {score.allPressures.length ? `${score.allPressures.length} of the answers point to a stage worth a look.` : 'None of the answers pointed to one stage.'} PROOF doesn't name a department. Placing the stall inside the business is Friction Audit work.
          </p>
        </details>

        <section className="px-res-sum" aria-labelledby="px-sum-h">
          <p id="px-sum-h" className="px-res-label">Summary</p>
          <p className="px-res-story">{story}</p>
          {score.pressures.length ? (
            <>
              <p className="px-res-label">Where the stall shows up</p>
              <ul className="px-res-list">
                {score.pressures.map((id) => (
                  <li key={id}>{audience.pressure[id]}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>


        <KeystonesPreview audienceId={audienceId} stage={stage} />

        <Estimate />

        {code ? (
          <section className="px-back" aria-labelledby="px-back-h">
            <p className="px-back-tag">The BACK offer</p>
            <h2 id="px-back-h" className="px-back-h">Bridge the Context Gap now.</h2>
            <p className="px-back-sub">Get BACK to the work.</p>
            <p className="px-back-value">Context Keystones: the folders, markdown files, scripts and protocols the agency&apos;s work runs on, built from these 15 answers and a short intake.</p>
            <p className="px-back-price"><KeystonesPrice offer={offer} /></p>
            <a className="px-btn px-btn-light px-back-btn" href={checkoutHref(code)}>Build Context Keystones from these answers <Arrow /></a>
            <p className="px-back-note">Downloads right after the intake. Business Aligned Context Keystones.</p>
          </section>
        ) : null}


        <BookCta note="45-minute call. No commitment." />
        <p className="px-meta px-res-retake"><button type="button" className="px-link" onClick={restart} style={{ background: 'none', border: 0, padding: 0, color: '#e8e8e8', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>Retake PROOF</button></p>
        <p className="px-meta px-res-direct">
          <a href="https://calendar.app.google/4mgKAmouyucz7jk79" target="_blank" rel="noopener">Book a FACT call</a>
          <br />
          45-minute call about the on-site FACT: scope, dates and travel.
        </p>

        <section className="px-ks px-res-next" aria-labelledby="px-next-h">
          <div className="px-ks-head">
            <h2 id="px-next-h">What happens next</h2>
          </div>
          <Ladder />
          <p className="px-meta px-res-direct px-res-offers"><a href="https://transformby10x.ai/offers/">See all offers</a></p>
        </section>

      </div>
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
        <h2 id="px-est-h">Estimated cost of this stall</h2>
        <p className="px-meta"><a href="https://transformby10x.ai/friction-model" target="_blank" rel="noopener">How it&apos;s calculated</a></p>
        <p className="px-est-sub">Payroll hours spent rebuilding context.</p>
        <p>Time cost, not savings or ROI</p>
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
