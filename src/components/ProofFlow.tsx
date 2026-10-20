'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trace } from '../lib/diagnostics';
import { AUDIENCES, AUDIENCE_ORDER, PROFILE_WORD, isAudienceId, type AudienceId } from '../lib/audiences';
import { QUESTIONS, isComplete, scoreMap, suggestDepartment } from '../lib/questionnaire';
import { BANDS, DEFAULT_SALARY, HOURS_PER_YEAR, POINTS_MAX, RAW_MAX, WEEKS_PER_YEAR, WEIGHT, estimate, liveMath, type LiveMath } from '../lib/math';
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
    title: 'Digital Fog',
    line: 'AI outpaced the infrastructure around it.',
    body: 'More drafts, faster, in more directions. The folders, owners and approvals stayed the same. Context starts getting lost between tools and people.',
  },
  {
    no: '02',
    title: 'The Role Reversal',
    line: 'AI was meant to help your team. Now your team helps the AI.',
    body: '',
  },
  {
    no: '03',
    title: 'Digital Friction',
    line: 'When the fog stops the work.',
    body: 'Handoffs stall. Rework grows. Momentum stops. The tools still work. The business just can’t carry what they produce.',
  },
] as const;

const BOOKING_URL = process.env.NEXT_PUBLIC_PROOF_BOOKING_URL ?? '';
const FRICTION_MODEL_URL = 'https://transformby10x.ai/review/friction-model/index.html';

const PATH = [
  ['PROOF', 'Free. 15 answers. Your map.'],
  ['Friction Audit', 'Paid. 2 weeks. Delivers your FACT report and your BizBlueprint.'],
  ['The Pipeline Airlock', 'Built by BizBuilders AI.'],
] as const;

/** Keep the last two words together so a line never ends on one short word. */
function tie(text: string): string {
  const i = text.lastIndexOf(' ');
  return i > 0 && text.length - i < 16 ? text.slice(0, i) + '\u00a0' + text.slice(i + 1) : text;
}

type Stage = 'intro' | 'ask' | 'result';

export function ProofFlow({ startAt = 'intro' }: { startAt?: Stage }) {
  const { ready, session, setSession, resetMap } = useSession();
  const [stage, setStage] = useState<Stage>(startAt);
  const [cursor, setCursor] = useState(0);
  const [audienceId, setAudienceId] = useState<AudienceId>('agency');
  const [openStory, setOpenStory] = useState<number | null>(1);
  const [tab, setTab] = useState(0);
  const [sheet, setSheet] = useState<null | 'path' | 'readout' | 'privacy' | 'story'>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const audience = AUDIENCES[audienceId];

  // Audience: ?for= wins, then the last choice on this device.
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
    const open = session.values.findIndex((value) => value === null);
    if (session.mapCompleted && open === -1) setStage('result');
    else {
      setCursor(open === -1 ? 0 : open);
      if (open > 0) setStage('ask');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session.mapCompleted]);

  const choose = useCallback(
    (choice: Choice) => {
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
        setStage('result');
      }
    },
    [cursor, session.optionIds, session.values, setSession]
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
  const live = useMemo(() => liveMath(answers), [session.values, session.optionIds]); // eslint-disable-line react-hooks/exhaustive-deps
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

  return (
    <div className={`px px--${stage}`} data-stage={stage}>
      <header className="px-bar">
        <Link href="/" className="px-mark" aria-label="PROOF home" onClick={() => setStage('intro')}>
          <span className="px-mark-dot" aria-hidden="true" />
          PROOF
        </Link>
        <span className="px-bar-sub">Fog &amp; friction diagnostic</span>
        <Letters filled={stage === 'intro' ? 0 : Math.floor(answered / 3)} current={stage === 'ask' ? letterIndex : -1} />
        <label className="px-select">
          <span>For</span>
          <select value={audienceId} onChange={(event) => chooseAudience(event.target.value as AudienceId)} aria-label="Your business">
            {AUDIENCE_ORDER.map((id) => (
              <option key={id} value={id}>
                {AUDIENCES[id].label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="px-stage" id="proof-stage">
        {!ready ? (
          <p className="px-loading">Opening PROOF</p>
        ) : stage === 'intro' ? (
          <section className="px-intro" aria-labelledby="px-title">
            <div className="px-intro-copy">
              <p className="px-kicker">
                <b>01</b> // The condition
              </p>
              <h1 id="px-title" className="px-display px-display--long">
                <span>AI was meant to help your team.</span>
                <span className="px-fog">Now your team helps the AI.</span>
                <span className="px-red px-display-q">{audience.headQuestion}</span>
              </h1>
              <p className="px-lede">
                {audience.lede[0]} <strong>{audience.lede[1]}</strong>
              </p>
              <div className="px-actions">
                <button type="button" className="px-btn" onClick={begin}>
                  {answered > 0 && answered < 15 ? `Continue PROOF · ${answered}/15` : score ? 'See your pattern' : 'Start PROOF'}
                  <Arrow />
                </button>
                <p className="px-meta">15 answers · free · no email</p>
              </div>
            </div>

            <div className="px-story-wrap">
            <p className="px-kicker px-story-kicker">// How it happens. Tap to open.</p>
            <ol className="px-story" aria-label="How it happens">
              {STORY.map((item, index) => {
                const open = openStory === index;
                return (
                  <li key={item.no} className={open ? 'is-open' : undefined}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => {
                        if (window.matchMedia('(max-width: 860px)').matches) {
                          setStoryIndex(index);
                          setSheet('story');
                          return;
                        }
                        setOpenStory(open ? null : index);
                      }}
                    >
                      <span className="px-no">{item.no}</span>
                      <span className="px-story-head">
                        <strong>{item.title}</strong>
                        <em>{item.line}</em>
                      </span>
                      <span className="px-plus" aria-hidden="true" />
                    </button>
                    <div className="px-story-body" hidden={!open}>
                      {index === 1 ? (
                        <>
                          <p>Capable people chase, check, remember and rebuild what the system should hold.</p>
                          <p className="px-quote">{audience.moment}</p>
                        </>
                      ) : (
                        <p>{item.body}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            </div>
          </section>
        ) : stage === 'ask' ? (
          <section className="px-ask" aria-labelledby="px-q">
            <aside className="px-ask-side" aria-label="The math, live">
              <p className="px-kicker px-kicker-light">
                <b>{LETTERS[letterIndex][0]}</b> // {LETTERS[letterIndex][1]} · question {cursor + 1} of 15
              </p>
              <MathPanel live={live} current={cursor} last={last} />
            </aside>
            <div className="px-ask-main">
              <MathStrip live={live} />
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
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      className={selected ? 'px-option is-selected' : 'px-option'}
                      aria-pressed={selected}
                      onClick={() => choose(choice)}
                    >
                      <span>{tie(audience.choices[cursor][index])}</span>
                      <b className="px-option-pts">{choice.value} pt</b>
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
                    See the pattern <Arrow />
                  </button>
                ) : (
                  <span className="px-hint">Keys 1 to 4 answer</span>
                )}
              </div>
            </div>
          </section>
        ) : score ? (
          <Result
            audienceId={audienceId}
            score={score}
            live={live}
            tab={tab}
            setTab={setTab}
            openReadout={() => setSheet('readout')}
            review={() => {
              setCursor(0);
              setStage('ask');
            }}
            restart={restart}
          />
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
            {PATH.map(([name], index) => (
              <span key={name} className={index === 0 ? 'is-here' : index === 2 ? 'is-bbai' : undefined}>
                {name}
              </span>
            ))}
          </span>
        </button>
        <button type="button" className="px-foot-link" onClick={() => setSheet(sheet === 'privacy' ? null : 'privacy')} aria-expanded={sheet === 'privacy'}>
          Privacy
        </button>
        <a className="px-foot-brand" href="https://transformby10x.ai" aria-label="TransformBy10X">
          <img src={`${BASE}/brand/tbtx-wordmark-black.png`} alt="TransformBy10X" width={263} height={137} />
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
                    <p>Capable people chase, check, remember and rebuild what the system should hold.</p>
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
                <p>Your answers stay in this browser. Nothing is sent unless you turn this on, and then only the page and the step, never your answers.</p>
                <DiagnosticsToggle />
              </div>
            ) : null}
            {sheet === 'readout' && score ? <Readout audienceId={audienceId} score={score} tab={tab} setTab={setTab} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Score = NonNullable<ReturnType<typeof scoreMap>>;

function Result({
  audienceId,
  score,
  live,
  tab,
  setTab,
  openReadout,
  review,
  restart,
}: {
  audienceId: AudienceId;
  score: Score;
  live: LiveMath;
  tab: number;
  setTab: (n: number) => void;
  openReadout: () => void;
  review: () => void;
  restart: () => void;
}) {
  const audience = AUDIENCES[audienceId];
  const departmentId = suggestDepartment(score.allPressures);
  const where = departmentId ? audience.department[departmentId] : 'Nothing stood out';
  const first = score.pressures[0] ? audience.pressure[score.pressures[0]] : 'No pressure was selected';
  const note = bookingNote(audience.label, PROFILE_WORD[score.profile], where, first, score.raw, score.index);
  const [copied, setCopied] = useState(false);
  const book = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!BOOKING_URL) return;
    try {
      void navigator.clipboard?.writeText(note).then(() => setCopied(true), () => undefined);
    } catch {
      // Clipboard can be blocked. The booking page still opens.
    }
    void event;
  };

  return (
    <section className="px-result" aria-labelledby="px-done">
      <div className="px-result-main">
        <p className="px-status">
          <span>
            PATTERN: <b className="px-red">{PROFILE_WORD[score.profile].toUpperCase()}</b>
          </span>
          <span>ANSWERS: 15/15</span>
          <span className="px-hide-sm">
            STALL POINT: <b className="px-blue">{where.toUpperCase()}</b>
          </span>
        </p>
        <h1 id="px-done" className="px-done" tabIndex={-1}>
          <span>Your PROOF is ready.</span>
        </h1>
        <p className="px-stall">
          Your work stalls in <b>{where.toLowerCase()}</b>. {tie(first)}.
        </p>
        <div className="px-actions px-book">
          <a
            className="px-btn px-btn-light"
            href={BOOKING_URL || mailtoLink(note)}
            target={BOOKING_URL ? '_blank' : undefined}
            rel={BOOKING_URL ? 'noopener' : undefined}
            onClick={book}
          >
            Book your 45-minute readout <Arrow />
          </a>
          <button type="button" className="px-link px-link-light px-show-sm" onClick={openReadout}>
            Open the readout <Arrow />
          </button>
        </div>
        <p className="px-book-sub">
          We go through your map, the stall point, and what to fix first.
          {BOOKING_URL ? <span> {copied ? 'Your map summary is copied. Paste it in the booking note.' : 'We copy your map summary for the booking note.'}</span> : null}
        </p>
        <WorkedMath live={live} score={score} />
        <Estimate />
        <p className="px-result-links">
          <button type="button" onClick={review}>Redo PROOF</button>
          <button type="button" onClick={restart}>Start again</button>
          <Link href="/visualizer?from=map">Open the desk model</Link>
        </p>
      </div>
      <aside className="px-snapshot" aria-label="Your PROOF">
        <p className="px-kicker">Your PROOF</p>
        <dl>
          <div>
            <dt>Pattern</dt>
            <dd>{PROFILE_WORD[score.profile]}</dd>
          </div>
          <div>
            <dt>Primary gap</dt>
            <dd>{first}</dd>
          </div>
          <div>
            <dt>Where it sits</dt>
            <dd>{where}</dd>
          </div>
        </dl>
        <div className="px-hide-sm">
          <Readout audienceId={audienceId} score={score} tab={tab} setTab={setTab} compact />
        </div>
      </aside>
    </section>
  );
}

const READOUT_TABS = ['Feeling', 'Cause', 'Where', 'Cost', 'Fix first', 'Next'] as const;

function Readout({
  audienceId,
  score,
  tab,
  setTab,
  compact = false,
}: {
  audienceId: AudienceId;
  score: Score;
  tab: number;
  setTab: (n: number) => void;
  compact?: boolean;
}) {
  const audience = AUDIENCES[audienceId];
  const departmentId = suggestDepartment(score.allPressures);
  const where = departmentId ? audience.department[departmentId] : null;
  const parts: Array<[string, React.ReactNode]> = [
    ['What you’re feeling', <p key="f">{audience.profile[score.profile]}</p>],
    [
      'What’s causing it',
      <p key="c">
        {score.archetype ? audience.archetype[score.archetype] + '.' : 'No single cause stood out.'} The tools work. The context around them didn’t keep up, so people carry it.
      </p>,
    ],
    [
      'Where it shows up',
      score.pressures.length ? (
        <ul key="w">
          {score.pressures.map((id) => (
            <li key={id}>{audience.pressure[id]}</li>
          ))}
        </ul>
      ) : (
        <p key="w">None of your answers flagged a pressure.</p>
      ),
    ],
    [
      'What it’s taking away',
      <p key="t">
        Time that should go to the {audience.client} goes to finding, checking and rebuilding context. That work isn’t on anyone’s job description.
      </p>,
    ],
    [
      'What to fix first',
      <p key="m">{where ? `Start with ${where.toLowerCase()}. ` : ''}{score.pressures[0] ? audience.pressure[score.pressures[0]] + '.' : 'Keep the connections you already have.'}</p>,
    ],
    [
      'What happens next',
      <p key="n">
        Book the 45-minute readout and we go through this map with you. If the stall is worth fixing, the Friction Audit runs for 2 weeks and delivers your FACT report and your BizBlueprint. BizBuilders AI then builds The Pipeline Airlock.
      </p>,
    ],
  ];
  return (
    <div className={compact ? 'px-readout is-compact' : 'px-readout'}>
      <div className="px-tabs" role="tablist" aria-label="Readout">
        {parts.map(([label], index) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={tab === index}
            className={tab === index ? 'is-on' : undefined}
            onClick={() => setTab(index)}
            title={label}
          >
            <i>{String(index + 1).padStart(2, '0')}</i>
            <span>{READOUT_TABS[index]}</span>
          </button>
        ))}
      </div>
      <div className="px-tab-panel" role="tabpanel">
        <p className="px-tab-title">{parts[tab][0]}</p>
        {parts[tab][1]}
      </div>
    </div>
  );
}

function PathPanel() {
  return (
    <div className="px-sheet-body">
      <p className="px-kicker">What happens after PROOF</p>
      <ol className="px-path">
        {PATH.map(([name, line], index) => (
          <li key={name} className={index === 2 ? 'is-bbai' : undefined}>
            <span className="px-no">{String(index + 1).padStart(2, '0')}</span>
            <strong>{name}</strong>
            <em>
              {line}
              {index === 2 ? (
                <img className="px-step-mark" src={`${BASE}/brand/bbai-wordmark-black.png`} alt="BizBuilders AI" width={274} height={138} />
              ) : null}
            </em>
          </li>
        ))}
      </ol>
      <p className="px-path-note">
        <span>Friction Audit and the readout are booked on the result screen.</span>
      </p>
    </div>
  );
}

/** The live instrument. Every number is read from liveMath, which mirrors scoreMap. */
function MathPanel({ live, current, last }: { live: LiveMath; current: number; last: number | null }) {
  const lastValue = last !== null ? live.dimensions.flatMap((d) => d.values)[last] : null;
  return (
    <div className="px-math">
      <p className="px-math-head">
        <span>The math</span>
        <span>answer pts × weight {WEIGHT} = contribution</span>
      </p>
      <ol className="px-math-dims">
        {live.dimensions.map((d, di) => {
          const active = Math.floor(current / 3) === di;
          return (
            <li key={d.name} className={active ? 'is-now' : undefined}>
              <b className="px-math-letter">{d.letter}</b>
              <span className="px-math-name">{d.name}</span>
              <span className="px-math-cells">
                {d.values.map((v, vi) => (
                  <i key={vi} className={di * 3 + vi === current ? 'is-cur' : v === null ? undefined : `v${v}`}>
                    {v === null ? '·' : v}
                  </i>
                ))}
              </span>
              <span className="px-math-bar" aria-hidden="true">
                <span style={{ width: `${(100 * d.points) / d.max}%` }} />
              </span>
              <span className="px-math-sub">
                {d.points}/{d.max}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="px-math-last" key={`${last}-${lastValue}`}>
        {last !== null && lastValue !== null ? (
          <>
            Q{String(last + 1).padStart(2, '0')} <span>{lastValue} pt × {WEIGHT}</span> = <b>+{lastValue * WEIGHT}</b>
          </>
        ) : (
          <>Each answer adds 0, 1 or {POINTS_MAX} points.</>
        )}
      </p>
      <div className="px-math-total">
        <p>
          <span>Raw</span>
          <b>{live.raw}</b>
          <em>/ {RAW_MAX}</em>
        </p>
        <p>
          <span>{live.answered === 15 ? 'Index' : 'Can still finish'}</span>
          {live.answered === 15 ? <b>{live.index}</b> : <b className="px-math-range">{live.floor} to {live.ceiling}</b>}
          <em>{live.answered === 15 ? '/ 100' : 'raw'}</em>
        </p>
      </div>
      <BandScale live={live} />
      <p className="px-math-foot">
        Index = round(100 × raw ÷ {RAW_MAX}) at 15/15 · Pressures flagged: <b>{live.pressureAtZero}</b> at 0 pt (ranked first), <b>{live.pressureAtOne}</b> at 1 pt
      </p>
    </div>
  );
}

function BandScale({ live }: { live: LiveMath }) {
  const pct = (n: number) => `${(100 * n) / RAW_MAX}%`;
  return (
    <div className="px-band" aria-label="Pattern bands on raw points">
      <div className="px-band-track">
        {BANDS.map((band) => (
          <span
            key={band.id}
            className={live.profile === band.id ? 'is-on' : undefined}
            style={{ left: pct(band.from), width: pct(band.to - band.from + 1) }}
          >
            <em>{PROFILE_WORD[band.id]}</em>
            <i>
              {band.from}-{band.to}
            </i>
          </span>
        ))}
        <b className="px-band-range" style={{ left: pct(live.floor), width: `max(3px, ${pct(live.ceiling - live.floor)})` }} />
      </div>
    </div>
  );
}

function MathStrip({ live }: { live: LiveMath }) {
  return (
    <p className="px-math-strip px-show-sm" aria-label="Running score">
      {live.dimensions.map((d) => (
        <span key={d.name}>
          {d.letter} <b>{d.points}</b>/{d.max}
        </span>
      ))}
      <span className="px-math-strip-raw">
        Raw <b>{live.raw}</b>/{RAW_MAX}
      </span>
    </p>
  );
}

function WorkedMath({ live, score }: { live: LiveMath; score: Score }) {
  const band = BANDS.find((b) => b.id === score.profile)!;
  return (
    <div className="px-worked" aria-label="How your pattern was calculated">
      <p className="px-worked-row">
        {live.dimensions.map((d, i) => (
          <span key={d.name}>
            {i > 0 ? <i>+</i> : null}
            <b>{d.points}</b>
            <em>{d.letter}</em>
          </span>
        ))}
        <span>
          <i>=</i>
          <b className="px-blue">{score.raw}</b>
          <em>raw / {RAW_MAX}</em>
        </span>
      </p>
      <p className="px-worked-line">
        Index = round(100 × {score.raw} ÷ {RAW_MAX}) = <b>{score.index}</b> · Raw {band.from} to {band.to} reads <b>{PROFILE_WORD[score.profile]}</b> · {score.allPressures.length} pressures flagged
      </p>
    </div>
  );
}

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(v);

function Estimate() {
  const [team, setTeam] = useState(1);
  const [salary, setSalary] = useState(DEFAULT_SALARY);
  const [hours, setHours] = useState(8);
  const e = estimate(team, salary, hours);
  const field = (label: string, value: number, set: (n: number) => void, step: number, unit?: string) => (
    <label className="px-est-field">
      <span>{label}</span>
      <span className="px-est-input">
        {unit === '$' ? <i>$</i> : null}
        <input type="number" inputMode="decimal" min={0} step={step} value={Number.isFinite(value) ? value : ''} onChange={(ev) => set(ev.target.value === '' ? 0 : Number(ev.target.value))} />
        {unit && unit !== '$' ? <i>{unit}</i> : null}
      </span>
    </label>
  );
  return (
    <section className="px-est" aria-labelledby="px-est-h">
      <div className="px-est-head">
        <h2 id="px-est-h">What context repair costs you</h2>
        <p className="px-est-sub">Payroll hours spent repairing context, per year.</p>
        <p>Capacity-cost equivalent, not cash savings or ROI</p>
      </div>
      <div className="px-est-fields">
        {field('Team size', team, setTeam, 1, 'people')}
        {field('Average salary', salary, setSalary, 1000, '$')}
        {field('Repair hours per week, per person', hours, setHours, 0.5, 'h')}
      </div>
      <ol className="px-est-steps" aria-live="polite">
        <li>
          <span className="px-eq"><var>C</var><sub>hour</sub> = <span className="px-frac"><span>salary</span><span>{num(HOURS_PER_YEAR)}</span></span> = <span className="px-frac"><span>{usd0.format(salary)}</span><span>{num(HOURS_PER_YEAR)}</span></span> = <b>{usd2.format(e.hourly)}</b></span>
          <small>What one paid hour costs. 2,080 is 40 hours over 52 weeks.</small>
        </li>
        <li>
          <span className="px-eq">weekly = hours × team × <var>C</var><sub>hour</sub> = {num(hours)} × {num(team)} × {usd2.format(e.hourly)} = <b>{usd2.format(e.weekly)}</b></span>
          <small>Paid time spent each week repairing work that arrived without what it needed.</small>
        </li>
        <li>
          <span className="px-eq">annual = weekly × {WEEKS_PER_YEAR} = {usd2.format(e.weekly)} × {WEEKS_PER_YEAR} = <b className="px-est-total">{usd0.format(e.annual)}</b></span>
          <small>Equal to {num(Math.round(e.salaryShare * 1000) / 10)}% of one {usd0.format(salary)} salary.</small>
        </li>
      </ol>
      <p className="px-est-note">These hours are your own estimate. The figure prices that time. It does not predict money saved.</p>
      <p className="px-est-bridge">
        This estimate used 2 of 9 equations. <a href={FRICTION_MODEL_URL}>The Friction Audit runs all 9 on your real handoffs in your FACT report (Friction Audit Context Telemetry).</a>
      </p>
      <div className="px-actions">
        <a className="px-btn px-btn-light" href={BOOKING_URL || 'https://calendar.app.google/ecuH2cxigdh5NQKy9'} target="_blank" rel="noopener">
          Book your 45-minute readout <Arrow />
        </a>
      </div>
    </section>
  );
}

function Letters({ filled, current }: { filled: number; current: number }) {
  return (
    <span className="px-letters" aria-hidden="true">
      {LETTERS.map(([letter, word], index) => (
        <span key={word} className={index < filled ? 'on' : index === current ? 'now' : undefined} title={word}>
          {letter}
        </span>
      ))}
    </span>
  );
}

function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg className="px-arrow" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" style={back ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function bookingNote(audience: string, pattern: string, where: string, gap: string, raw: number, index: number): string {
  return `PROOF map\nBusiness: ${audience}\nPattern: ${pattern} (raw ${raw}/30, index ${index})\nStall point: ${where}\nPrimary gap: ${gap}`;
}

function mailtoLink(note: string): string {
  const subject = 'PROOF: book my 45-minute readout';
  return `mailto:erik@transformby10x.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(note + '\n\nA good time to talk:\n')}`;
}
