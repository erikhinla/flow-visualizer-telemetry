'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trace } from '../lib/diagnostics';
import { AUDIENCES, AUDIENCE_ORDER, PROFILE_WORD, isAudienceId, type AudienceId } from '../lib/audiences';
import { QUESTIONS, isComplete, scoreMap, suggestDepartment } from '../lib/questionnaire';
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

const SIDE = [
  ['Your progress isn’t slow.', 'Your system is unclear.'],
  ['The tools answer fast.', 'The handoffs don’t.'],
  ['More output.', 'Same infrastructure.'],
  ['Good people.', 'Carrying what the system can’t.'],
  ['This is where', 'the friction shows up.'],
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
    title: 'The Context Coordinator',
    line: 'A job nobody hired for.',
    body: '',
  },
  {
    no: '03',
    title: 'Digital Friction',
    line: 'When the fog stops the work.',
    body: 'Handoffs stall. Rework grows. Momentum stops. The tools still work. The business just can’t carry what they produce.',
  },
] as const;

const PATH = [
  ['PROOF', '15 answers. Free.'],
  ['Agreed engagement', 'Scope set with you.'],
  ['BizBlueprint', 'The paid fix plan.'],
  ['Implementation', 'BizBuilders AI builds it.'],
  ['Completion review', 'The work is checked.'],
] as const;

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
        <span className="px-bar-sub">Fog &amp; Friction Forensics</span>
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
                <span>Nobody hired a</span>
                <span className="px-fog">Context Coordinator.</span>
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
            <aside className="px-ask-side" aria-hidden="true">
              <p className="px-kicker px-kicker-light">
                <b>02</b> // {LETTERS[letterIndex][0]} · {LETTERS[letterIndex][1]}
              </p>
              <p className="px-side-big" key={letterIndex}>
                {SIDE[letterIndex][0]}
                <span>{SIDE[letterIndex][1]}</span>
              </p>
              <p className="px-side-tag">&gt;&gt;&gt; That’s Digital Fog.</p>
            </aside>
            <div className="px-ask-main">
              <div className="px-progress" aria-hidden="true">
                {QUESTIONS.map((item, index) => (
                  <i key={item.id} className={session.values[index] !== null ? 'on' : index === cursor ? 'now' : undefined} />
                ))}
              </div>
              <p className="px-count">
                [ {String(cursor + 1).padStart(2, '0')} / 15 ]
              </p>
              <h1 id="px-q" ref={headingRef} tabIndex={-1} className="px-question">
                {audience.questions[cursor]}
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
                      <span>{audience.choices[cursor][index]}</span>
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
              <span key={name} className={index === 0 ? 'is-here' : undefined}>
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
  tab,
  setTab,
  openReadout,
  review,
  restart,
}: {
  audienceId: AudienceId;
  score: Score;
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
  const mail = bookingLink(audience.label, PROFILE_WORD[score.profile], where);

  return (
    <section className="px-result" aria-labelledby="px-done">
      <div className="px-result-main">
        <p className="px-status">
          <span>
            PATTERN: <b className="px-red">{PROFILE_WORD[score.profile].toUpperCase()}</b>
          </span>
          <span>ANSWERS: 15/15</span>
          <span className="px-hide-sm">
            FIRST LOOK: <b className="px-blue">{where.toUpperCase()}</b>
          </span>
        </p>
        <h1 id="px-done" className="px-done" tabIndex={-1}>
          <span>Your system is mapped.</span>
          <span className="px-blue">Your bottleneck is identified.</span>
          <span>Your blueprint is ready to scope.</span>
        </h1>
        <div className="px-actions">
          <a className="px-btn px-btn-light" href={mail}>
            Talk through the pattern <Arrow />
          </a>
          <button type="button" className="px-link px-link-light px-show-sm" onClick={openReadout}>
            Open the readout <Arrow />
          </button>
        </div>
        <p className="px-result-links">
          <button type="button" onClick={review}>Review answers</button>
          <button type="button" onClick={restart}>Start again</button>
          <Link href="/visualizer?from=map">Open the desk model</Link>
        </p>
      </div>
      <aside className="px-snapshot" aria-label="Your snapshot">
        <p className="px-kicker">Your snapshot</p>
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
        Time that should go to the {audience.client} goes to finding, checking and rebuilding context. That’s the Context Coordinator job, and it isn’t on anyone’s job description.
      </p>,
    ],
    [
      'What matters first',
      <p key="m">{where ? `Start with ${where.toLowerCase()}. ` : ''}{score.pressures[0] ? audience.pressure[score.pressures[0]] + '.' : 'Keep the connections you already have.'}</p>,
    ],
    [
      'What happens next',
      <p key="n">We talk through this pattern. If it’s worth changing, we agree the engagement, then the BizBlueprint. A number can’t unlock BizBot Mrktng. The completion review does.</p>,
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
            {String(index + 1).padStart(2, '0')}
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
          <li key={name}>
            <span className="px-no">{String(index + 1).padStart(2, '0')}</span>
            <strong>{name}</strong>
            <em>
              {line}
              {name === 'Implementation' ? (
                <img className="px-step-mark" src={`${BASE}/brand/bbai-wordmark-black.png`} alt="BizBuilders AI" width={274} height={138} />
              ) : null}
            </em>
          </li>
        ))}
      </ol>
      <p className="px-path-note">
        <img className="px-path-mark" src={`${BASE}/brand/bbm-wordmark-white.png`} alt="BizBot Mrktng" width={322} height={138} />
        <span><b>A number can’t unlock BizBot Mrktng.</b> The completion review does.</span>
      </p>
    </div>
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

function bookingLink(audience: string, pattern: string, where: string): string {
  const subject = 'PROOF: talk through my pattern';
  const body = `Business: ${audience}\nPattern: ${pattern}\nFirst place to look: ${where}\n\nA good time to talk:\n`;
  return `mailto:erik@transformby10x.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
