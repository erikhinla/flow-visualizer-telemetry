'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trace } from '../lib/diagnostics';
import { AUDIENCES, AUDIENCE_ORDER, isAudienceId, type AudienceId } from '../lib/audiences';
import { QUESTIONS, isComplete, scoreMap } from '../lib/questionnaire';
import { LADDER, Ladder, Result } from './ProofResult';
import { tidyAll } from '../lib/tidy';
import { encodeProof } from '../lib/proof-code';
import { RAW_MAX, liveMath } from '../lib/math';
import type { Choice } from '../lib/types';
import { DiagnosticsToggle } from './Shell';
import { useSession } from './SessionProvider';

const BASE = process.env.NEXT_PUBLIC_PROOF_BASE_PATH ?? '';

const AUDIENCE_KEY = 'proof.audience.v1';
const LETTERS = [
  ['P', 'Process'],
  ['R', 'Response'],
  ['O', 'Output'],
  ['O', 'Operating capacity'],
  ['F', 'Friction'],
] as const;

const STORY = [
  {
    no: '01',
    title: 'Context Erosion',
    line: "AI tools increase output, but context doesn't keep up, so humans fill the gap.",
    body: 'More drafts, faster, in more directions. The folders, owners and approvals stayed the same. Context starts getting lost between tools and people.',
  },
  {
    no: '02',
    title: 'The Role Reversal',
    line: 'AI was meant to assist people.\nBut people are assisting AI.',
    body: '',
  },
  {
    no: '03',
    title: 'Digital Friction',
    line: 'When lost context stops the work.',
    body: 'Rework grows. Handoffs stall. Momentum stops. The process just can’t carry what AI produces.',
  },
] as const;



/** Keep the last two words together so a line never ends on one short word. */
function tie(text: string): string {
  const i = text.lastIndexOf(' ');
  return i > 0 && text.length - i < 16 ? text.slice(0, i) + '\u00a0' + text.slice(i + 1) : text;
}

type Stage = 'intro' | 'ask' | 'processing' | 'result';

/** Phones only: the short beat between the last answer and the result. */
const PROCESS_MS = 1500;
const PICK_MS = 180;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ProofFlow({ startAt = 'intro' }: { startAt?: Stage }) {
  const { ready, session, setSession, resetMap } = useSession();
  const [stage, setStage] = useState<Stage>(startAt);
  const [cursor, setCursor] = useState(0);
  const [audienceId, setAudienceId] = useState<AudienceId>('agency');
  const [openStory, setOpenStory] = useState<number | null>(1);
  const [tab, setTab] = useState(0);
  const [sheet, setSheet] = useState<null | 'path' | 'privacy' | 'story'>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const audience = AUDIENCES[audienceId];

  // Audience: ?for= wins, then the last choice on this device.
  // Keep line breaks clean where text-wrap: pretty is unsupported. Runs after React renders.
  useEffect(() => {
    const root = document.querySelector('.px');
    if (!root) return;
    let raf = 0;
    const run = () => { raf = 0; obs.disconnect(); tidyAll(root); obs.observe(root, { subtree: true, childList: true, characterData: true }); };
    const obs = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(run); });
    run();
    return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(max-width: 860px)').matches) setOpenStory(null);
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('for');
      const stored = window.localStorage.getItem(AUDIENCE_KEY);
      if (isAudienceId(fromUrl)) setAudienceId(fromUrl);
      else if (isAudienceId(stored)) setAudienceId(stored);
    } catch {
      // Storage can be blocked. The agency wording stays.
    }
  }, []);

  const chooseAudience = (id: AudienceId) => {
    setAudienceId(id);
    try {
      window.localStorage.setItem(AUDIENCE_KEY, id);
      const url = new URL(window.location.href);
      url.searchParams.set('for', id);
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      // Not saved. The wording still changes for this visit.
    }
  };

  // Restore where the visitor left off.
  useEffect(() => {
    if (!ready) return;
    // A fresh visit always starts a fresh run. Only a share/result code in the URL keeps the last result.
    const q = new URLSearchParams(window.location.search);
    const keep = q.has('result') || q.has('code') || q.has('share');
    if (!keep) {
      if (session.values.some((value) => value !== null) || session.mapCompleted) resetMap();
      setCursor(0);
      return;
    }
    const open = session.values.findIndex((value) => value === null);
    if (session.mapCompleted && open === -1) setStage('result');
    else {
      setCursor(open === -1 ? 0 : open);
      if (open > 0) setStage('ask');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Runs once when the session is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const commit = useCallback(
    (choice: Choice, phone: boolean) => {
      const values = [...session.values];
      const optionIds = [...session.optionIds];
      setLast(cursor);
      values[cursor] = choice.value;
      optionIds[cursor] = choice.id;
      const done = values.every((value) => value !== null);
      setSession((current) => ({ ...current, values, optionIds, mapCompleted: done || current.mapCompleted }));
      if (done) trace({ name: 'map-complete' });
      if (cursor < QUESTIONS.length - 1) setCursor(cursor + 1);
      else {
        setTab(0);
        if (done) {
          // Phones: lock input and show the processing beat before the result.
          setStage('processing');
          timers.current.push(window.setTimeout(() => setStage('result'), reducedMotion() ? 600 : PROCESS_MS));
        } else setStage('result');
      }
    },
    [cursor, session.optionIds, session.values, setSession]
  );

  const choose = useCallback(
    (choice: Choice) => {
      if (picked) return;
      // Both viewports (round 17): hold the tapped answer for a beat so the selection reads before the next question.
      setPicked(choice.id);
      timers.current.push(
        window.setTimeout(() => {
          setPicked(null);
          commit(choice, true);
        }, reducedMotion() ? 0 : PICK_MS)
      );
    },
    [commit, picked]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape') setSheet(null);
      if (stage !== 'ask') return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (cursor === 0) setStage('intro');
        else setCursor(cursor - 1);
      }
      const n = Number(event.key);
      if (n >= 1 && n <= 4) {
        event.preventDefault();
        choose(QUESTIONS[cursor].choices[n - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose, cursor, stage]);

  useEffect(() => {
    if (stage === 'ask') headingRef.current?.focus({ preventScroll: true });
  }, [cursor, stage]);

  const answers = { values: session.values, optionIds: session.optionIds };
  const answered = session.values.filter((value) => value !== null).length;
  const score = useMemo(() => (ready ? scoreMap(answers) : null), [ready, session.values, session.optionIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const begin = () => {
    const open = session.values.findIndex((value) => value === null);
    setCursor(open === -1 ? 0 : open);
    setStage(open === -1 && score ? 'result' : 'ask');
  };

  const restart = () => {
    resetMap();
    setCursor(0);
    setStage('ask');
  };

  const letterIndex = stage === 'result' ? 5 : Math.floor(cursor / 3);

  useEffect(() => {
    if (document.querySelector('script[data-tbx]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = BASE + "/anchors.css?v=11";
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = BASE + "/anchors.js?v=12";
    script.defer = true;
    script.dataset.tbx = '1';
    document.body.appendChild(script);
  }, []);

  return (
    <div className={`px px--${stage}`} data-stage={stage}>
      <header className="px-bar">
        <Link href="/" className="px-mark" aria-label="PROOF home" onClick={() => setStage('intro')}>
          <span className="px-mark-dot" aria-hidden="true" />
          PROOF
        </Link>
        <Sections stage={stage} current={letterIndex} />
        <label className="px-select">
          <span>For</span>
          <select value={audienceId} onChange={(event) => chooseAudience(event.target.value as AudienceId)} aria-label="Business type">
            {AUDIENCE_ORDER.map((id) => (
              <option key={id} value={id}>
                {AUDIENCES[id].label}
              </option>
            ))}
          </select>
        </label>
        <a className="px-bar-brand" href="https://transformby10x.ai" aria-label="TransformBy10X">
          <img src={`${BASE}/brand/tbtx-white.png`} alt="TransformBy10X" width={431} height={348} />
        </a>
      </header>

      <div className="px-stage" id="proof-stage">
        {!ready ? (
          <p className="px-loading">Opening PROOF</p>
        ) : stage === 'intro' ? (
          <section className="px-intro" aria-labelledby="px-title">
            <nav className="tbx-anchors" data-page="proof" />
            <div className="px-intro-copy">
              <div className="px-intro-head">
                <h1 id="px-title" className="px-display px-display--long">
                  <span>AI tools make more work.</span>
                  <span className="px-fog">Not less.</span>
                  {audience.headQuestion ? <span className="px-red px-display-q">{audience.headQuestion}</span> : null}
                </h1>
                <p className="px-lede px-lede--intro"><span><span>Your people carry the context</span> <span>the system can't.</span></span> <span>See where the work stalls.</span></p>
              </div>
              <div className="px-actions px-carnival-wrap">
                <button type="button" className="px-carnival" onClick={begin}>
                  <span className="px-carnival-ball" aria-hidden="true" style={{ backgroundImage: `url(${BASE}/brand/proof-sphere.webp)` }} />
                  <span className="px-carnival-label">
                    {answered > 0 && answered < 15 ? `Continue PROOF · ${answered}/15` : score ? 'See the pattern' : 'SEE PROOF'}
                  </span>
                </button>
              </div>
            </div>
          </section>
        ) : stage === 'ask' ? (
          <section className="px-ask" aria-labelledby="px-q">
            <aside className="px-ask-side" aria-label="Progress">
              <p className="px-kicker px-kicker-light">Question {cursor + 1} of 15</p>
              <p className="px-ask-tip">Answer for how the work runs today.</p>
              <p className="px-ask-tip px-ask-tip-sub">{15 - answered > 0 ? `${answered} of 15 answered.` : 'All 15 answered.'}</p>
              <LivePanel cursor={cursor} values={session.values} optionIds={session.optionIds} label={(id) => audience.pressure[id]} />
            </aside>
            <div className="px-ask-main">
              <LiveBar cursor={cursor} values={session.values} optionIds={session.optionIds} label={(id) => audience.pressure[id]} />
              <div className="px-progress" aria-hidden="true">
                {QUESTIONS.map((item, index) => (
                  <i key={item.id} className={session.values[index] !== null ? 'on' : index === cursor ? 'now' : undefined} />
                ))}
              </div>
              <p className="px-count">
                [ {String(cursor + 1).padStart(2, '0')} / 15 ]
              </p>
              <h1 id="px-q" ref={headingRef} tabIndex={-1} className="px-question">
                {tie(audience.questions[cursor])}
              </h1>
              <div className="px-options" role="group" aria-labelledby="px-q">
                {QUESTIONS[cursor].choices.map((choice, index) => {
                  const selected = session.optionIds[cursor] === choice.id;
                  const cls = 'px-option' + (selected ? ' is-selected' : '') + (picked === choice.id ? ' is-picked' : '');
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      className={cls}
                      aria-disabled={picked ? true : undefined}
                      aria-pressed={selected}
                      onClick={() => choose(choice)}
                    >
                      <span>{tie(audience.choices[cursor][index])}</span>
                      <kbd>[{index + 1}]</kbd>
                    </button>
                  );
                })}
              </div>
              <div className="px-ask-nav">
                <button type="button" className="px-link" onClick={() => (cursor === 0 ? setStage('intro') : setCursor(cursor - 1))}>
                  <Arrow back /> Back
                </button>
                {isComplete(answers) ? (
                  <button type="button" className="px-link" onClick={() => setStage('result')}>
                    See the PROOF results <Arrow />
                  </button>
                ) : (
                  <span className="px-hint">Keys 1 to 4 answer</span>
                )}
              </div>
            </div>
          </section>
        ) : stage === 'processing' ? (
          <Processing />
        ) : score ? (
          <Result audienceId={audienceId} score={score} restart={restart} code={encodeProof(audienceId, answers)} />
        ) : (
          <section className="px-intro">
            <p className="px-lede">Some answers are missing.</p>
            <button type="button" className="px-btn" onClick={begin}>
              Finish PROOF <Arrow />
            </button>
          </section>
        )}
      </div>

      <footer className="px-foot">
        <button type="button" className="px-foot-path" onClick={() => setSheet(sheet === 'path' ? null : 'path')} aria-expanded={sheet === 'path'}>
          <span className="px-foot-label">What happens after</span>
          <span className="px-foot-steps" aria-hidden="true">
            {LADDER.map(([name], index) => (
              <span key={name} className={index === 0 ? 'is-here' : index >= 4 ? 'is-bbai' : undefined}>
                {name}
              </span>
            ))}
          </span>
        </button>
        <button type="button" className="px-foot-link" onClick={() => setSheet(sheet === 'privacy' ? null : 'privacy')} aria-expanded={sheet === 'privacy'}>
          Privacy
        </button>
        <a className="px-foot-brand" href="https://transformby10x.ai" aria-label="TransformBy10X">
          <img src={`${BASE}/brand/tbtx-black.png`} alt="TransformBy10X" width={431} height={348} />
        </a>
      </footer>

      {sheet ? (
        <div className="px-sheet-wrap" onClick={() => setSheet(null)}>
          <div className="px-sheet" role="dialog" aria-modal="true" aria-label={sheet} onClick={(event) => event.stopPropagation()}>
            <button type="button" className="px-close" onClick={() => setSheet(null)} aria-label="Close">
              ×
            </button>
            {sheet === 'path' ? <PathPanel /> : null}
            {sheet === 'story' ? (
              <div className="px-sheet-body">
                <p className="px-kicker">
                  <b>{STORY[storyIndex].no}</b> {STORY[storyIndex].title}
                </p>
                <p className="px-sheet-title">{STORY[storyIndex].line}</p>
                {storyIndex === 1 ? (
                  <>
                    <p>Capable people chase, check, remember and rebuild what the system should keep track of.</p>
                    <p className="px-quote">{audience.moment}</p>
                  </>
                ) : (
                  <p>{STORY[storyIndex].body}</p>
                )}
                {storyIndex < 2 ? (
                  <button type="button" className="px-link" onClick={() => setStoryIndex(storyIndex + 1)}>
                    Next: {STORY[storyIndex + 1].title} <Arrow />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="px-btn"
                    onClick={() => {
                      setSheet(null);
                      begin();
                    }}
                  >
                    Start PROOF <Arrow />
                  </button>
                )}
              </div>
            ) : null}
            {sheet === 'privacy' ? (
              <div className="px-sheet-body">
                <p className="px-kicker">Privacy</p>
                <p>Answers stay in this browser. Nothing is sent unless this setting is on, and then only the page and the step, never the answers.</p>
                <DiagnosticsToggle />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const PROCESS_LINES = ['15 answers locked', 'Scoring the Map', 'Locating where work stalls', 'Building the PROOF result'] as const;

/** Both viewports. A short status beat while the result opens. Input is locked because no answers render. */
function Processing() {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (reducedMotion()) {
      setShown(PROCESS_LINES.length);
      return;
    }
    const step = PROCESS_MS / PROCESS_LINES.length;
    const ids = PROCESS_LINES.slice(1).map((_, i) => window.setTimeout(() => setShown(i + 2), step * (i + 1)));
    return () => ids.forEach((t) => window.clearTimeout(t));
  }, []);
  return (
    <section className="px-proc" role="status" aria-live="polite" aria-label="Building the PROOF result">
      <span className="px-proc-orb" aria-hidden="true" />
      <ol className="px-proc-log">
        {PROCESS_LINES.slice(0, shown).map((line, i) => (
          <li key={line} className={i === shown - 1 ? 'is-now' : undefined}>
            <span aria-hidden="true">&gt;</span> {line}
          </li>
        ))}
      </ol>
    </section>
  );
}

function PathPanel() {
  return (
    <div className="px-sheet-body">
      <p className="px-kicker">What happens after PROOF</p>
      <Ladder light />
      <p className="px-path-note">
        <span>Book on the results screen: Remote FACT or On-Site FACT. Both write your Context Keystones from all nine measurements. On-Site FACT also ends with the FACT report.</span>
      </p>
    </div>
  );
}

/** Section words in the bar. Status only, not links: current magenta, done white, upcoming muted, all lit on results. */
function Sections({ stage, current }: { stage: string; current: number }) {
  const state = (i: number) =>
    stage === 'result' || stage === 'processing' ? 'is-lit' : stage === 'ask' ? (i < current ? 'is-done' : i === current ? 'is-now' : 'is-next') : undefined;
  return (
    <p className="px-bar-sub" data-stage={stage}>
      {LETTERS.map(([, word], i) => (
        <span key={word} className={state(i)} aria-current={state(i) === 'is-now' ? 'step' : undefined}>
          {i ? <i aria-hidden="true"> · </i> : null}
          {word}
        </span>
      ))}
    </p>
  );
}

function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg className="px-arrow" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" style={back ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** What each question measures, read from the question and its four choices. */
const MEASURES: readonly string[] = [
  'Where work stops moving: at the start, at handoffs, or at the finish.',
  'Whether the next piece of work is set by a system or worked out as it goes.',
  'Whether approvals, feedback, and notes sit in one shared record or in memory and messages.',
  'How many AI tools are in use, and whether they connect to each other.',
  'Whether what the team learned on one piece of work carries into the next.',
  'Whether missed leads, requests, and questions get followed up without relying on memory.',
  'Whether each piece of work has a named owner when it needs to move.',
  'Whether AI use has operating rules and a person accountable for it.',
  'Whether decisions under deadline follow a written rule or whoever is around.',
  'How much follow-up still depends on someone remembering it.',
  'How often existing work gets redone or searched for.',
  'Whether work keeps moving when the one key person is out.',
  'Whether live work and approvals can be seen as they change.',
  'Whether finished work changes how the next piece runs.',
  'One word for how the operation runs day to day.',
]

type LiveProps = {
  cursor: number;
  values: Array<0 | 1 | 2 | null>;
  optionIds: Array<string | null>;
  label: (id: import('../lib/types').PressureId) => string;
};

const SCORE_DIRECTION = 'Higher means work moves smoother, with less Digital Friction.';

function liveView({ values, optionIds, label }: LiveProps) {
  // Running score from liveMath (src/lib/math.ts), the same arithmetic as scoreMap.
  const live = liveMath({ values, optionIds } as Parameters<typeof liveMath>[0]);
  // Friction order matches scoreMap: 0-point pressures first, then 1-point pressures.
  const zeros: string[] = [];
  const ones: string[] = [];
  QUESTIONS.forEach((question, index) => {
    const value = values[index];
    if (value === null || value === undefined) return;
    const pressure = question.choices.find((item) => item.id === optionIds[index])?.pressure;
    if (!pressure) return;
    const text = label(pressure);
    if (value === 0 && !zeros.includes(text)) zeros.push(text);
    if (value === 1 && !ones.includes(text) && !zeros.includes(text)) ones.push(text);
  });
  const friction = [...zeros, ...ones].slice(0, 4);
  // Phone terminal: one line per answered question that scored under 2, newest last. Real answers only.
  const log: Array<{ q: number; text: string; pts: number }> = [];
  QUESTIONS.forEach((question, index) => {
    const value = values[index];
    if (value === null || value === undefined || value >= 2) return;
    const pressure = question.choices.find((item) => item.id === optionIds[index])?.pressure;
    if (pressure) log.push({ q: index + 1, text: label(pressure), pts: value });
  });
  return { live, friction, log };
}

function LivePanel(props: LiveProps) {
  const { cursor } = props;
  const { live, friction } = liveView(props);
  return (
    <div className="px-live">
      <div className="px-live-block">
        <p className="px-live-label">Running Map score</p>
        <p className="px-live-num">
          <b>{live.raw}</b> <span>of {RAW_MAX} points</span>
        </p>
        <div className="px-live-bar" aria-hidden="true">
          <i style={{ width: `${(100 * live.raw) / RAW_MAX}%` }} />
        </div>
        <p className="px-live-note">
          {live.answered === 0 ? 'Builds with each answer. Final score after all 15.' : `After ${live.answered} answer${live.answered > 1 ? 's' : ''}. Final score after all 15.`}
        </p>
        <p className="px-live-note">{SCORE_DIRECTION}</p>
      </div>
      <div className="px-live-block">
        <p className="px-live-label">This question measures</p>
        <p className="px-live-note px-live-measure">{MEASURES[cursor]}</p>
      </div>
      {friction.length ? (
        <div className="px-live-block">
          <p className="px-live-label">Digital Friction so far</p>
          <ul className="px-live-list">
            {friction.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function LiveBar(props: LiveProps) {
  const { cursor } = props;
  const { live, friction, log } = liveView(props);
  const [open, setOpen] = useState(false);
  return (
    <div className="px-mbar">
      <ol className="px-term" aria-label="Friction found so far">
        {log.length ? (
          log.slice(-3).map((line) => (
            <li key={line.q}>
              <span aria-hidden="true">&gt;</span> Q{String(line.q).padStart(2, '0')} · {line.text} · {line.pts} of 2
            </li>
          ))
        ) : (
          <li className="is-idle">
            <span aria-hidden="true">&gt;</span> {live.answered ? 'No friction flagged yet' : 'Waiting for the first answer'}
          </li>
        )}
      </ol>
      <p className="px-term-range">
        Map score range <b>{live.floor}</b> to <b>{live.ceiling}</b> of {RAW_MAX}
      </p>
      <div className="px-mbar-row">
        <p className="px-mbar-score">
          Running Map score <b>{live.raw}</b> of {RAW_MAX}
        </p>
        <button type="button" className="px-mbar-toggle" aria-expanded={open} aria-controls="px-mbar-drawer" onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Details'}
        </button>
      </div>
      <div className="px-live-bar" aria-hidden="true">
        <i style={{ width: `${(100 * live.raw) / RAW_MAX}%` }} />
      </div>
      {open ? (
        <div id="px-mbar-drawer" className="px-mbar-drawer">
          <p className="px-live-note">{SCORE_DIRECTION}</p>
          <p className="px-live-label">This question measures</p>
          <p className="px-live-note">{MEASURES[cursor]}</p>
          {friction.length ? (
            <>
              <p className="px-live-label">Digital Friction so far</p>
              <ul className="px-live-list">
                {friction.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
