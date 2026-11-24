'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { AUDIENCES, PROFILE_WORD, type AudienceId } from '../lib/audiences';
import { BANDS, HOURS_PER_YEAR, RAW_MAX, WEEKS_PER_YEAR, estimate, liveMath } from '../lib/math';
import { QUESTIONS } from '../lib/questionnaire';
import { useSession } from './SessionProvider';
import { narrative } from '../lib/narrative';
import { stageFor } from '../lib/stage';
import type { scoreMap } from '../lib/questionnaire';
import type { ProfileId } from '../lib/types';
import { Tip } from './Tip';
import { NINE, TIP_ANNUAL, TIP_DIMENSION, TIP_FACT_ALL_NINE, TIP_HOURLY, TIP_LEVEL, TIP_MAP_SCORE, TIP_REPAIR_COST, TIP_SCORING, TIP_STAGE, TIP_THREE_OF_NINE } from '../lib/tips';
import { KeystonesPrice, checkoutHref, useKeystonesOffer } from './KeystonesPrice';

import { REVIEW_URL } from '../lib/links';
import { deptPageHref } from '../lib/brand';
import { getDepartment } from '../lib/departments';
export { REVIEW_URL };
const FACT_URL = 'https://transformby10x.ai/fact/';

/** On phones each results screen shows one layer at a time. Next reveals the next layer. */
const LAYERS: Readonly<Record<string, number>> = {};

/** Counts from zero to a real computed value. Phones only; reduced motion shows the value at once. */
export function useCountUp(target: number, on: boolean, ms = 1200): number {
  const [value, setValue] = useState(on ? 0 : target);
  useEffect(() => {
    if (!on || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min((now - start) / ms, 1);
      setValue(target * (1 - Math.pow(1 - t, 4)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    setValue(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, on, ms]);
  return value;
}

function CountUp({ value, on, format = (v) => String(Math.round(v)) }: { value: number; on: boolean; format?: (v: number) => string }) {
  const shown = useCountUp(value, on);
  return (
    <>
      <span aria-hidden="true" className="px-count-up">{format(shown)}</span>
      <span className="px-sr">{format(value)}</span>
    </>
  );
}

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
  SCALING: 'The work moves, but the same details get rebuilt along the way.',
  COMPOUNDING: 'Most of the work is connected. The goal is keeping it that way as the team grows.',
};

type Score = NonNullable<ReturnType<typeof scoreMap>>;

/** The four patterns in score order, one per band in math.ts BANDS. The pattern word is the result headline. */
/** Plain result names and headlines. The internal pattern ids stay the same. */
const RESULT_NAME: Record<ProfileId, string> = {
  FRAGMENTED: 'Runs on memory',
  STALLED: 'Stuck in handoffs',
  SCALING: 'Moving, with rework',
  COMPOUNDING: 'Running clean',
};
const RESULT_HEAD: Record<ProfileId, string> = {
  FRAGMENTED: 'Your work runs on people’s memory.',
  STALLED: 'Your work gets stuck between teams.',
  SCALING: 'Work moves, but gets redone along the way.',
  COMPOUNDING: 'Your work moves cleanly. Keep it that way.',
};
const LEVELS: ReadonlyArray<{ id: ProfileId; n: number; name: string }> = BANDS.map((b, i) => ({ id: b.id, n: i + 1, name: RESULT_NAME[b.id] }));
const levelOf = (id: ProfileId) => LEVELS.find((l) => l.id === id)!;

/** Phone results order: pattern and where it stalls, then what it costs, then the detail. */
const PHONE_SCREENS = ['Your result', 'What it’s costing', 'Where to start', 'Want help'] as const;
/** Screens that carry their own Review card. Every other screen shows the Review strip above the nav. */
const OWN_CTA: readonly string[] = ['Want help'];
/** Example inputs for the cost screen until the visitor types their own. */
const COST_DEFAULTS = { team: 6, salary: 90000, hours: 5 } as const;
const CORE_LINE = "AI creates faster than human-speed handoffs. Context can't keep up.";

/** "X of 15 answers scored low. Most are in A and B." Low = 0 of 2. Falls back to 1 of 2 when no answer scored 0. */
export function lowLine(values: ReadonlyArray<number | null>, names: readonly string[]): string {
  const scored = values.filter((v): v is number => v !== null);
  if (!scored.length) return '';
  const floor = scored.includes(0) ? 0 : scored.includes(1) ? 1 : null;
  if (floor === null) return `All ${scored.length} answers scored 2 of 2.`;
  const counts = names.map(() => 0);
  values.forEach((v, i) => { if (v === floor) counts[Math.floor(i / 3)] += 1; });
  const total = counts.reduce((a, b) => a + b, 0);
  const top = Math.max(...counts);
  const lead = names.filter((_, i) => counts[i] === top);
  const join = (xs: string[]) => (xs.length < 2 ? xs[0] : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  const head = floor === 0 ? `${total} of ${values.length} answers scored low.` : `No answer scored 0. ${total} of ${values.length} scored 1 of 2.`;
  if (floor === 0 && total === values.length) return `All ${total} answers scored low.`;
  if (total === 1) return `${head} It is in ${lead[0]}.`;
  if (top === total) return `${head} All are in ${lead[0]}.`;
  if (lead.length > 2) return `${head} They are spread across ${join(lead)}.`;
  return `${head} Most are in ${join(lead)}.`;
}

export function Arrow() {
  return (
    <svg className="px-arrow" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      <path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}



/** Offer cards, used on the last results screen on desktop and phones. BACK first and the only filled button. Value before price. */
/** Desktop only: a slight tilt toward the pointer (max 3deg). Off for touch and reduced motion. Writes CSS vars, no re-render. */
const canTilt = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function tilt(ev: RPointerEvent<HTMLLIElement>) {
  if (!canTilt()) return;
  const el = ev.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (ev.clientX - r.left) / r.width - 0.5;
  const y = (ev.clientY - r.top) / r.height - 0.5;
  el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
  el.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`);
}
function untilt(ev: RPointerEvent<HTMLLIElement>) {
  ev.currentTarget.style.removeProperty('--rx');
  ev.currentTarget.style.removeProperty('--ry');
}

/** React 18 has no typed `inert`; an empty string attribute turns it on. */
const inertIf = (on: boolean) => (on ? { inert: '' } : {}) as Record<string, string>;

type CardBack = { sections: ReadonlyArray<readonly [string, string | readonly string[] | ReactNode]>; benefit?: string };

/** One offer card with a front and a back face. The (i) button flips it; Back flips it home. Focus follows. */
function OfferCard({ id, lead = false, title, back, children }: { id: string; lead?: boolean; title: string; back: CardBack; children: ReactNode }) {
  const [flipped, setFlipped] = useState(false);
  const info = useRef<HTMLButtonElement>(null);
  const backHead = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    if (flipped) backHead.current?.focus({ preventScroll: true });
    else info.current?.focus({ preventScroll: true });
  }, [flipped]);
  const flip = (to: boolean) => { moved.current = true; setFlipped(to); };
  return (
    <li className={`px-oc-card${lead ? ' is-lead' : ''}${flipped ? ' is-flipped' : ''}`} onPointerMove={tilt} onPointerLeave={untilt}
      onKeyDown={(ev) => { if (ev.key === 'Escape' && flipped) { ev.stopPropagation(); flip(false); } }}>
      <div className="px-oc-inner">
        <div className="px-oc-face px-oc-front" aria-hidden={flipped || undefined} {...inertIf(flipped)}>
          <button ref={info} type="button" className="px-oc-info" aria-expanded={flipped} aria-controls={`${id}-back`} aria-label={`What's inside ${title}`} onClick={() => flip(true)}>
            <span aria-hidden="true">i</span>
          </button>
          {children}
        </div>
        <div className="px-oc-face px-oc-back" id={`${id}-back`} aria-hidden={!flipped || undefined} {...inertIf(!flipped)}>
          <h3 className="px-oc-back-h" ref={backHead} tabIndex={-1}>{title}</h3>
          {back.sections.map(([label, body]) => (
            <div className="px-oc-back-sec" key={label}>
              <p className="px-oc-back-label">{label}</p>
              {typeof body === 'string' ? <p className="px-oc-back-text">{body}</p> : Array.isArray(body) ? <ul className="px-oc-back-list">{(body as string[]).map((x) => <li key={x}>{x}</li>)}</ul> : body}
            </div>
          ))}
          {back.benefit ? <p className="px-oc-back-benefit">{back.benefit}</p> : null}
          <button type="button" className="px-oc-back-btn" aria-expanded={flipped} aria-controls={`${id}-back`} onClick={() => flip(false)}>← Back</button>
        </div>
      </div>
    </li>
  );
}


/** Last results screen: the Review is the one ask. FACT and BACK are one quiet line each. */
function NextSteps() {
  return (
    <div className="px-ns">
      <div className="px-oc-head">
        <h2 className="px-res-h px-oc-h px-ns-h" tabIndex={-1}>Want me to go over this with you?</h2>
        <p className="px-res-sub px-oc-sub px-ns-sub">We go through your answers together, and I show you where to start.</p>
      </div>
      <section className="px-ns-review" aria-label="PROOF Review">
        <p className="px-ns-review-line">PROOF Review · $127</p>
        <div className="px-ns-cta">
          <a className="px-oc-btn is-fill px-ns-btn" href={REVIEW_URL} target="_blank" rel="noopener">Book a PROOF Review <span aria-hidden="true">→</span></a>
        </div>
      </section>
      <details className="px-res-how px-ns-other">
        <summary>Not ready for a call?</summary>
        <p className="px-ns-more">Running a team? FACT measures this in your team’s real work. <a className="px-ns-link" href={FACT_URL}>See FACT</a></p>
        <p className="px-ns-more">Doing it on your own? BACK is the plan you run yourself. $74 for the first 50, then $347. <a className="px-ns-link px-ns-link--quiet" href="https://transformby10x.ai/back/">See BACK</a></p>
      </details>
    </div>
  );
}

/** Round 18 draft: each answer maps to the Keystones that fix it (vocabulary from keystones/generator). */
type Key = { name: string; kind: 'Folder' | 'Markdown file' | 'Script' | 'Protocol'; does: string };
const K: Record<string, Key> = {
  handoff: { name: 'handoff-protocol.md', kind: 'Protocol', does: 'Says what “ready” means before work moves on, and who receives it, so the next person starts without chasing.' },
  keyPerson: { name: 'handoff-protocol.md', kind: 'Protocol', does: 'Moves what the client lead knows into project.md, so the work keeps going when they’re out.' },
  start: { name: 'START HERE.md', kind: 'Markdown file', does: 'One page in every project that shows where everything lives.' },
  project: { name: 'project.md', kind: 'Markdown file', does: 'The brief, the next step and who owns it, in one place anyone can open.' },
  decisions: { name: 'decisions.md', kind: 'Markdown file', does: 'Every call written down once, with who made it and when, so it isn’t made twice.' },
  folders: { name: 'Project folders', kind: 'Folder', does: 'One home for every file, and each folder names the role that owns it.' },
  ai: { name: 'AI-CONTEXT.md', kind: 'Markdown file', does: 'The one file every assistant reads first, so answers match no matter who asks.' },
  skills: { name: 'skills/', kind: 'Folder', does: 'Ready instructions for common jobs, so the output comes back the same way each time.' },
  changelog: { name: 'change-log.md', kind: 'Markdown file', does: 'A running record of what changed and why, kept after the job ends.' },
  archive: { name: 'archive_old_versions.py', kind: 'Script', does: 'Moves older versions into _archive and logs each move. The current file is obvious and nothing is lost.' },
  notify: { name: 'notify.py', kind: 'Script', does: 'Tells the right person when something changes, so nothing waits on memory.' },
  pending: { name: 'pending_changes.py', kind: 'Script', does: 'Writes PENDING-CHANGES.md, the short list of what’s still open, before each team update.' },
  agenda: { name: 'round_agenda.py', kind: 'Script', does: 'Builds each review’s agenda from the record, so nobody starts from a blank page.' },
  change: { name: 'change-protocol.md', kind: 'Protocol', does: 'What happens when something changes, so the whole team hears it once.' },
  watch: { name: 'watch.py', kind: 'Script', does: 'Checks every project and logs it in WATCH-LOG.md, so status is there when you look.' },
  rounds: { name: 'review-rounds-protocol.md', kind: 'Protocol', does: 'Each review round ends with notes the next one starts from.' },
};
export const RX: Record<number, { gap: string; keys: Key[] }> = {
  1: { gap: 'Work keeps losing speed at the same point.', keys: [K.handoff, K.start] },
  2: { gap: 'People aren’t sure what comes next, so they wait or ask.', keys: [K.project, K.agenda] },
  3: { gap: 'Briefs, approvals and feedback live in heads and chat threads.', keys: [K.project, K.decisions, K.folders] },
  4: { gap: 'Each AI tool works from its own version of the facts.', keys: [K.ai, K.skills] },
  5: { gap: 'What a job teaches leaves when the job ends.', keys: [K.changelog, K.archive] },
  6: { gap: 'A missed request waits until someone happens to notice.', keys: [K.notify, K.pending] },
  7: { gap: 'When work has to move, nobody’s sure who has it.', keys: [K.handoff, K.folders] },
  8: { gap: 'AI output changes depending on who asked.', keys: [K.ai, K.skills] },
  9: { gap: 'Deadline calls get made by whoever is around, then made again.', keys: [K.decisions, K.change] },
  10: { gap: 'Too much depends on someone remembering to follow up.', keys: [K.pending, K.notify] },
  11: { gap: 'The team remakes or hunts for work that already exists.', keys: [K.folders, K.archive] },
  12: { gap: 'Work stalls when the person who knows the client is out.', keys: [K.keyPerson, K.project] },
  13: { gap: 'Seeing where every job stands takes a meeting.', keys: [K.watch, K.start] },
  14: { gap: 'The team doesn’t get better from one job to the next.', keys: [K.rounds, K.changelog] },
  15: { gap: 'Most days run on reacting instead of a plan.', keys: [K.project, K.handoff] },
};

export function Result({ audienceId, score, code, restart }: { audienceId: AudienceId; score: Score; restart: () => void; code?: string | null }) {
  const audience = AUDIENCES[audienceId];
  const p0 = score.pressures[0];
  const stage = p0 ? stageFor(audienceId, p0) : null;
  const first = p0 ? audience.pressure[p0] : null;
  const story = narrative({ audienceId, profile: score.profile, pressures: score.pressures, label: (id) => audience.pressure[id] });
  const band = BANDS.find((b) => b.id === score.profile)!;
  const offer = useKeystonesOffer();
  const { session } = useSession();
  const lm = liveMath({ values: session.values, optionIds: session.optionIds } as Parameters<typeof liveMath>[0]);
  const lvl = levelOf(score.profile);
  const nextLvl = LEVELS.find((l) => l.n === lvl.n + 1) ?? null;
  const nextBand = nextLvl ? BANDS.find((b) => b.id === nextLvl.id)! : null;
  const phoneScreens: readonly string[] = PHONE_SCREENS;
  // Desktop follows the same readiness-first order as phones, in its own layout. Offers only on the last screen.
  const deskScreens: readonly string[] = PHONE_SCREENS;
  const phone = usePhone();
  const screens = phone ? phoneScreens : deskScreens;
  const [step, setStep] = useState(0);
  const [layer, setLayer] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const opts = { subtree: true, childList: true, characterData: true };
    const mo = new MutationObserver(() => { mo.disconnect(); tidyBreaks(el); mo.observe(el, opts); });
    tidyBreaks(el);
    mo.observe(el, opts);
    return () => mo.disconnect();
  }, []);
  useEffect(() => { setStep(0); setLayer(0); }, [phone]);
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

  const dims = lm.dimensions;
  const minPts = Math.min(...dims.map((d) => d.points));
  const weakest = dims.filter((d) => d.points === minPts);
  const allAnswers = QUESTIONS.map((question, index) => {
    const value = session.values[index];
    const pressure = question.choices.find((c) => c.id === session.optionIds[index])?.pressure ?? null;
    return { q: index + 1, value, text: pressure ? audience.pressure[pressure] : audience.questions[index] };
  })
    .filter((a) => a.value !== null)
    .sort((a, b) => (a.value as number) - (b.value as number) || a.q - b.q);
  const lowAnswers = allAnswers.filter((a) => (a.value as number) < 2);
  // At Level 4 there is no next band: list the lowest answers even when they score 2 of 2.
  const listAnswers = nextLvl ? lowAnswers : allAnswers;
  const gap = nextBand ? nextBand.from - score.raw : 0;
  // Prescription: top 3 gaps from the lowest answers, one per section first, then the next lowest.
  const rxPool = listAnswers.length ? listAnswers : allAnswers;
  const rxPick: typeof allAnswers = [];
  for (const x of rxPool) if (rxPick.length < 3 && !rxPick.some((y) => Math.floor((y.q - 1) / 3) === Math.floor((x.q - 1) / 3))) rxPick.push(x);
  for (const x of rxPool) if (rxPick.length < 3 && !rxPick.includes(x)) rxPick.push(x);
  const low = lowLine(session.values, dims.map((d) => d.name));

  return (
    <section ref={root} className="px-result px-res px-res-steps" aria-labelledby="px-done">
      <p className="px-res-badge"><span>{lvl.name}</span><span> · {score.raw} of {RAW_MAX}</span> <Tip label={`About ${lvl.name}`}>{TIP_LEVEL[score.profile]}</Tip></p>
      <div className="px-res-panel" ref={panel} key={current} data-on={phone ? shown : undefined}>
        {current === 'Your result' ? (
          <div className="px-res-screen px-pat">
            <p className="px-res-label">Your result</p>
            <h1 id="px-done" className="px-res-h px-lvl-h px-pat-h" tabIndex={-1}>{RESULT_HEAD[score.profile]}</h1>
            <p className="px-res-sub px-pat-lede">{audience.profile[score.profile]}</p>
            <div className="px-res-box">
              <p className="px-res-label">Where it stalls</p>
              <p className="px-res-value px-res-big">{stage ?? 'No single stage'}</p>
              <p className="px-res-sub">{first ? `${first}.` : 'It shows up all over, not in one place.'}</p>
            </div>
            <details className="px-res-how">
              <summary>How this was scored</summary>
              <p className="px-res-sub">You scored {score.raw} of {RAW_MAX}. Each of the 15 answers is worth 0, 1 or 2 points. 0 to 7: {RESULT_NAME.FRAGMENTED}. 8 to 14: {RESULT_NAME.STALLED}. 15 to 22: {RESULT_NAME.SCALING}. 23 to 30: {RESULT_NAME.COMPOUNDING}.</p>
            </details>
          </div>
        ) : null}

        {current === 'What it’s costing' ? (
          <div className="px-res-screen">
            <Estimate phone={phone} />
          </div>
        ) : null}

        {current === 'Where to start' ? (
          <div className="px-res-screen px-rx">
            <h2 className="px-res-h" tabIndex={-1}>Where to start</h2>
            <p className="px-res-sub">Three fixes from your answers. Tap one to see it.</p>
            <ol className="px-rx-list px-start-list">
              {rxPick.map((a) => (
                <li key={a.q} className="px-rx-item">
                  <details className="px-start-item">
                    <summary className="px-rx-gaptext"><b>{RX[a.q].gap}</b></summary>
                    <p className="px-rx-kdoes">The fix: {RX[a.q].keys[0].does}</p>
                  </details>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {current === 'Want help' ? (
          <div className="px-res-screen">
            <NextSteps />
          </div>
        ) : null}
      </div>

      {OWN_CTA.includes(current) ? null : (
        <p className="px-res-cta px-res-cta--quiet"><a className="px-res-quiet" href={REVIEW_URL} target="_blank" rel="noopener">PROOF Review · $127 <span aria-hidden="true">→</span></a></p>
      )}

      <nav className="px-res-nav" aria-label="Result screens">
        <button type="button" className="px-res-navbtn" onClick={goBack} disabled={step === 0 && shown === 0}>← Back</button>
        <span className="px-res-count">
          {String(step + 1).padStart(2, '0')} / {String(screens.length).padStart(2, '0')}<span className="px-res-count-name"> · {current}</span>
        </span>
        {shown < layers - 1 ? (
          <button type="button" className="px-res-navbtn is-next" onClick={goNext}>Next →</button>
        ) : step < last ? (
          <button type="button" className="px-res-navbtn is-next" onClick={goNext}>Next<span className="px-res-next-name">: {screens[step + 1]}</span> →</button>
        ) : null}
      </nav>

    </section>
  );
}

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(v);

function Estimate({ phone = false }: { phone?: boolean }) {
  const [team, setTeam] = useState(String(COST_DEFAULTS.team));
  const [salary, setSalary] = useState(String(COST_DEFAULTS.salary));
  const [hours, setHours] = useState(String(COST_DEFAULTS.hours));
  // Until a field changes, the figure is an example for a team of 6, and the screen says so.
  const [own, setOwn] = useState(false);
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
        <input type="number" inputMode="decimal" min={0} placeholder={placeholder} value={value} onChange={(ev) => { setOwn(true); set(ev.target.value); }} />
        {unit && unit !== '$' ? <i>{unit}</i> : null}
      </span>
    </label>
  );
  return (
    <section className="px-est" aria-labelledby="px-est-h">
      <div className="px-est-head">
        <h2 id="px-est-h">What it’s costing you</h2>
      </div>
      <div aria-live="polite">
        {e ? (
          <p className="px-est-result">
            {own ? 'Your team pays' : 'A team of 6 pays'} <b className="px-est-total"><CountUp value={e.annual} on format={(v) => usd0.format(v)} /></b> a year for time spent finding, checking and redoing work.
          </p>
        ) : (
          <p className="px-est-result is-empty">Enter three numbers to see the figure.</p>
        )}
      </div>
      <details className="px-res-how px-est-own" open={own}>
        <summary>{own ? 'Your numbers' : 'Use your own numbers'}</summary>
        <div className="px-est-fields">
          {field('People on the team', team, setTeam, 'e.g. 6', 'people')}
          {field('Average salary', salary, setSalary, 'e.g. 90000', '$')}
          {field('Hours a week each person spends finding, checking, or rebuilding work', hours, setHours, 'e.g. 5', 'h')}
        </div>
      </details>
      {e ? (
        <details className="px-res-how">
          <summary>Show the math</summary>
          <p className="px-est-plain">{num(h)} hours × {num(t)} people × {usd2.format(e.hourly)} an hour × {WEEKS_PER_YEAR} weeks = {usd0.format(e.annual)} a year. Paid time, not money saved.</p>
          <p className="px-est-plain">For a team, <a href={FACT_URL}>FACT measures this in your real work.</a></p>
        </details>
      ) : null}
    </section>
  );
}

/* Round 17: clean breaks. Changes spaces and hyphens inside existing text nodes only (no new nodes), so React keeps its references.
   Glues numbers and prices to their unit, "Level 2", "15 to 22", "an hour", hyphenated terms, and the last word of each block. */
const NB = '\u00a0';
function tidyText(t: string): string {
  return t
    .replace(/([A-Za-z])-(?=[A-Za-z])/g, '$1\u2011')
    .replace(/(\d[\d,.]*%?) (?=[A-Za-z$\d(])/g, '$1' + NB)
    .replace(/\b(of|to|at|adds|Q|from|all) (?=[$]?\d)/g, '$1' + NB)
    .replace(/\b(an?|per) (hour|year|week|month|person)\b/g, '$1' + NB + '$2')
    .replace(/\b(Context|Repair) (Repair|Cost)\b/g, '$1' + NB + '$2');
}
function tidyBreaks(rootEl: HTMLElement) {
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
  for (const n of nodes) {
    if (n.parentElement?.closest('input, textarea, select, script, style')) continue;
    const next = tidyText(n.data);
    if (next !== n.data) n.data = next;
  }
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1].data, b = nodes[i].data;
    if (/\d%?$/.test(a) && /^ [A-Za-z]/.test(b)) nodes[i].data = NB + b.slice(1);
  }
  rootEl.querySelectorAll('h1, h2, h3, p, li').forEach((el) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const texts: Text[] = [];
    for (let n = w.nextNode(); n; n = w.nextNode()) if ((n as Text).data.trim() && !(n as Text).parentElement?.closest('.px-tip, button, .px-sr')) texts.push(n as Text);
    const last = texts[texts.length - 1];
    if (!last) return;
    const m = last.data.match(/^([\s\S]*\S) (\S{1,14}\s*)$/);
    if (m) last.data = m[1] + NB + m[2];
    else if (/^\S{1,14}\s*$/.test(last.data) && texts.length > 1) {
      const prev = texts[texts.length - 2];
      if (/\S $/.test(prev.data)) prev.data = prev.data.slice(0, -1) + NB;
    }
  });
}
