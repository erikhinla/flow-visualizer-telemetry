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
  ['Remote FACT', 'Reads real handoffs from current work, remotely. $1,750. Call first.'],
  ['On-Site FACT', 'On site. Ends with the FACT report: where delivery stalls, what it costs, and what to change first. $4,500 plus travel: $2,250 up front, $1,125 on arrival, $1,125 on completion. Call first.'],
]

/** FACT spelled out where it first shows on a screen. */
export const LADDER_FULL: Readonly<Record<string, string>> = {
  'Remote FACT': 'Remote FACT (Friction Assessment Context Telemetry)',
};

/** On phones each results screen shows one layer at a time. Next reveals the next layer. */
const LAYERS: Readonly<Record<string, number>> = {
  'Where work stalls': 1,
  'What the answers show': 2,
  'Payroll hours': 2,
  'Context Keystones': 2,
  'What happens next': 3,
};

function usePhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(max-width: 900px)');
    const on = () => setPhone(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return phone;
}

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


export const REMOTE_FACT_URL = 'https://buy.stripe.com/8x29ASfUzdMW0Px7JUc3m08';
export const ONSITE_FACT_URL = 'https://calendar.app.google/Xu3RZNM4nEuATHee7';

/** Result CTAs in order: BACK first, then Remote FACT, On-Site FACT and the PROOF Review. Value line before any price. */
function NextCtas({ code, offer, layer, phone }: { code?: string | null; offer: ReturnType<typeof useKeystonesOffer>; layer?: number; phone?: boolean }) {
  return (
    <ol className="px-next-ctas" data-layer={layer} aria-label="Next steps">
      <li className="is-first">
        <a className="px-btn px-btn-light" href={checkoutHref(code)}>{phone ? "Get BACK (Business Aligned Context Keystones)" : "Get BACK"} <Arrow /></a>
        <p className="px-meta">The context written down once, built from these 15 answers. <KeystonesPrice offer={offer} /></p>
      </li>
      <li>
        <a className="px-next-link" href={REMOTE_FACT_URL} target="_blank" rel="noopener">{phone ? "Remote FACT (Friction Assessment Context Telemetry)" : "Remote FACT"} <Arrow /></a>
        <p className="px-meta">Real handoffs from current work, read remotely. $1,750.</p>
      </li>
      <li>
        <a className="px-next-link" href={ONSITE_FACT_URL} target="_blank" rel="noopener">On-Site FACT <Arrow /></a>
        <p className="px-meta">On site, ending with the FACT report on where delivery stalls. Call first.</p>
      </li>
      <li>
        <a className="px-next-link" href={REVIEW_URL} target="_blank" rel="noopener">PROOF Review with Erik <Arrow /></a>
        <p className="px-meta">A 45-minute call about this PROOF result.</p>
      </li>
    </ol>
  );
}

export function Ladder({ light = false, split = false }: { light?: boolean; split?: boolean }) {
  return (
    <ol className={light ? 'px-ks-ladder is-light' : 'px-ks-ladder'} aria-label="What happens next">
      {LADDER.map(([name, line], i) => (
        <li key={name} className={i === 0 ? 'is-here' : undefined} data-layer={split ? (i < 2 ? 0 : 1) : undefined}>
          <span className="px-no">{String(i + 1).padStart(2, '0')}</span>
          <strong>{LADDER_FULL[name] ?? name}</strong>
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
  const [layer, setLayer] = useState(0);
  const [how, setHow] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const phone = usePhone();
  const last = screens.length - 1;
  const current = screens[step];
  const layers = phone ? LAYERS[current] ?? 1 : 1;
  const shown = Math.min(layer, layers - 1);
  const goNext = () => {
    if (shown < layers - 1) setLayer(shown + 1);
    else { setStep(step < last ? step + 1 : 0); setLayer(0); }
  };
  const goBack = () => {
    if (shown > 0) { setLayer(shown - 1); return; }
    const prev = step - 1;
    setStep(prev);
    setLayer(phone ? (LAYERS[screens[prev]] ?? 1) - 1 : 0);
  };
  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('.px-res-screen')?.scrollTo({ top: 0 });
    panel.current?.querySelector<HTMLElement>('h1, h2')?.focus({ preventScroll: true });
  }, [step, shown]);
  useEffect(() => {
    if (!how) return;
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setHow(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [how]);

  return (
    <section className="px-result px-res px-res-steps" aria-labelledby="px-done">
      <div className="px-res-panel" ref={panel} key={current} data-on={phone ? shown : undefined}>
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
              <p className="px-res-sub"><b>People aren&apos;t the problem. The process is.</b> This score shows where context can&apos;t keep up with AI output.</p>
            </div>
            <div className="px-actions px-res-cta">
              <a className="px-btn px-btn-light" href={checkoutHref(code)}>Get BACK (Business Aligned Context Keystones) <Arrow /></a>
              <p className="px-meta">Built from these 15 answers. <KeystonesPrice offer={offer} /> <a href={REVIEW_URL} target="_blank" rel="noopener">Or book a PROOF Review with Erik.</a></p>
            </div>
          </div>
        ) : null}

        {current === 'What the answers show' ? (
          <div className="px-res-screen">
            <p className="px-res-label">15 answers · {PROFILE_WORD[score.profile]} · {score.raw} of {RAW_MAX}</p>
            <h2 className="px-res-h" tabIndex={-1}>What the answers show</h2>
            <div className="px-res-box" data-layer={0}>
              <p className="px-res-feel">{audience.profile[score.profile]}</p>
              <p className="px-res-story">{story}</p>
            </div>
            {score.pressures.length ? (
              <div className="px-res-box" data-layer={1}>
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
                <p className="px-prod-fix" data-layer={0}>The agency&apos;s own tools keep the context, so nobody rebuilds it by hand. Bridge the Context Erosion and get back to the work.</p>
                <ul className="px-prod-parts" aria-label="What's inside" data-layer={1}>
                  <li><span>01 · Folders</span>A structure where the brief, decisions and status live with the work.</li>
                  <li><span>02 · Markdown files</span>The context written down once, readable by people and agents.</li>
                  <li><span>03 · Scripts</span>Small helpers that keep the record current without extra steps.</li>
                  <li><span>04 · Protocols</span>The handoff rules the team follows at the stage where work stalls{stage ? `: ${stage}` : ''}.</li>
                </ul>
                <div className="px-prod-buy" data-layer={0}>
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
            <div className="px-res-box px-res-next" data-layer-box="">
              <Ladder split />
            </div>
            <NextCtas code={code} offer={offer} layer={2} phone={phone} />
          </div>
        ) : null}
      </div>

      <nav className="px-res-nav" aria-label="Result screens">
        <button type="button" className="px-res-navbtn" onClick={goBack} disabled={step === 0 && shown === 0}>← Back</button>
        <span className="px-res-count">
          {String(step + 1).padStart(2, '0')} / {String(screens.length).padStart(2, '0')}<span className="px-res-count-name"> · {current}</span>
        </span>
        <span className="px-res-tools">
          <button type="button" className="px-link" onClick={() => setHow(true)}>How we scored this</button>
          <button type="button" className="px-link" onClick={restart}>Retake PROOF</button>
        </span>
        {shown < layers - 1 ? (
          <button type="button" className="px-res-navbtn is-next" onClick={goNext}>Next →</button>
        ) : step < last ? (
          <button type="button" className="px-res-navbtn is-next" onClick={goNext}>Next<span className="px-res-next-name">: {screens[step + 1]}</span> →</button>
        ) : (
          <button type="button" className="px-res-navbtn is-next" onClick={goNext}>Start over →</button>
        )}
      </nav>

      {how ? (
        <div className="px-res-overlay" onClick={() => setHow(false)}>
          <div className="px-res-how-panel" role="dialog" aria-modal="true" aria-labelledby="px-how-h" onClick={(ev) => ev.stopPropagation()}>
            <div className="px-prod-bar"><span id="px-how-h">How we scored this</span><button type="button" className="px-close" onClick={() => setHow(false)} aria-label="Close">×</button></div>
            <div className="px-res-how-body">
              <p>Each answer is worth 0, 1, or 2 points. The total is {score.raw} of {RAW_MAX}, which reads {PROFILE_WORD[score.profile]} ({band.from} to {band.to}). The bands are 0 to 7 Fragmented, 8 to 14 Stalled, 15 to 22 Scaling, and 23 to 30 Compounding.</p>
              <p>The lowest-scoring answer names the stage where work stalls. {score.allPressures.length ? `${score.allPressures.length} of the answers point to a stage worth a look.` : "None of the answers pointed to one stage."} PROOF doesn't name a department. Finding where work stalls inside the business is the FACT Process.</p>
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
        <p className="px-meta" data-layer={0}><a href="https://transformby10x.ai/friction-model" target="_blank" rel="noopener">How the payroll hours are calculated</a></p>
        <p data-layer={0}>Time cost, not savings or return on investment</p>
      </div>
      <div className="px-est-fields" data-layer={0}>
        {field('People on the team', team, setTeam, 'e.g. 6', 'people')}
        {field('Average salary', salary, setSalary, 'e.g. 90000', '$')}
        {field('Hours a week each person spends finding, checking, or rebuilding work', hours, setHours, 'e.g. 5', 'h')}
      </div>
      <div aria-live="polite" data-layer={1}>
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
      <p className="px-est-note" data-layer={1}>These hours are an estimate. The figure prices that time, not money saved.</p>
      <p className="px-est-bridge" data-layer={1}>
        PROOF runs 3 of 9 measurements, where the hours go and what they cost: 01 Map score and 08 + 09 Context repair cost. <a href={FRICTION_MODEL_URL}>FACT runs all 9 on real handoffs.</a>
      </p>
    </section>
  );
}
