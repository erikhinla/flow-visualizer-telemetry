'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trace } from '../lib/diagnostics';
import { formatHours } from '../lib/format';
import { scenarioDirty } from '../lib/operational';
import {
  ARCHETYPE_FALLBACK,
  ARCHETYPE_LABEL,
  PRESSURE_LABEL,
  PROFILE_COPY,
  PROFILE_HOURS,
  QUESTIONS,
  clampTeam,
  isComplete,
  scoreMap,
  suggestDepartment,
  teamHours,
} from '../lib/questionnaire';
import { DESK_TRACE_PRICE } from '../lib/offer';
import type { Choice } from '../lib/types';
import { getDepartment } from '../lib/departments';
import { useSession } from './SessionProvider';

export function MapExperience() {
  const { ready, session, setSession, resetMap } = useSession();
  const [cursor, setCursor] = useState(0);
  const [mode, setMode] = useState<'ask' | 'result'>('ask');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const choose = useCallback(
    (choice: Choice) => {
      const values = [...session.values];
      const optionIds = [...session.optionIds];
      values[cursor] = choice.value;
      optionIds[cursor] = choice.id;
      const done = values.every((value) => value !== null);
      setSession((current) => ({
        ...current,
        values,
        optionIds,
        mapCompleted: done || current.mapCompleted,
      }));
      if (done) trace({ name: 'map-complete' });
      if (cursor < QUESTIONS.length - 1) setCursor(cursor + 1);
      else setMode('result');
    },
    [cursor, session.optionIds, session.values, setSession]
  );

  useEffect(() => {
    if (!ready) return;
    const open = session.values.findIndex((value) => value === null);
    if (session.mapCompleted && open === -1) setMode('result');
    else setCursor(open === -1 ? 0 : open);
    // Only when storage finishes loading. Reviewing an answer should not jump the cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (mode !== 'ask') return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCursor((current) => Math.max(0, current - 1));
      }
      const choiceNumber = Number(event.key);
      if (choiceNumber >= 1 && choiceNumber <= 4) {
        event.preventDefault();
        choose(QUESTIONS[cursor].choices[choiceNumber - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose, cursor, mode]);

  useEffect(() => {
    if (!ready || mode !== 'ask') return;
    headingRef.current?.focus();
  }, [cursor, mode, ready]);

  if (!ready) {
    return <p className="note">Opening the scan…</p>;
  }

  const answers = { values: session.values, optionIds: session.optionIds };
  const score = scoreMap(answers);
  const question = QUESTIONS[cursor];

  if (mode === 'result' && score) {
    const hours = teamHours(score.profile, session.teamSize);
    const range = PROFILE_HOURS[score.profile];
    const department = getDepartment(suggestDepartment(score.pressures));
    return (
      <article className="map-result">
        <p className="kicker">Agency scan · answers, not a measurement</p>
        <h1>{PROFILE_COPY[score.profile]}</h1>
        <p className="lede">
          Answers suggest {range.low}–{range.high} hours a person, every week, spent finding the work
          instead of doing it. If you get those hours back, the judgment still stays with your
          people. PROOF has not counted your desk.
        </p>
        <h2>Places to check</h2>
        <p className="note">
          Zero-point answers come first, then one-point answers. These are the first four. Two-point
          answers add no pressure.
        </p>
        {score.pressures.length === 0 ? (
          <p>
            <span className="kicker">Default hint</span> {ARCHETYPE_FALLBACK}
          </p>
        ) : (
          <ol className="pressure-list">
            {score.pressures.map((id) => (
              <li key={id}>
                <code>{id}</code>
                {PRESSURE_LABEL[id]}
              </li>
            ))}
          </ol>
        )}
        <details className="inspector">
          <summary>How this was scored</summary>
          <p>
            Profile token {score.profile}. Raw score {score.raw} of 30. Answer index {score.index} of
            100. The index is the rounded share of the raw score. It is not a health percentage.
          </p>
          <p className="archetype">
            <span>Routing hint</span>
            {ARCHETYPE_LABEL[score.archetype]} <code>{score.archetype}</code>
          </p>
        </details>
        <div className="team">
          <label htmlFor="team-size">
            People in the preset hour range{' '}
            <strong>{clampTeam(session.teamSize)}</strong>
          </label>
          <input
            id="team-size"
            type="range"
            min={1}
            max={50}
            value={clampTeam(session.teamSize)}
            onChange={(event) =>
              setSession((current) => ({
                ...current,
                teamSize: clampTeam(Number(event.target.value)),
              }))
            }
          />
          <p>
            {formatHours(hours.low, 0)}–{formatHours(hours.high, 0)} hours per week in this preset.
            The profile range is {range.low}–{range.high} hours per person. PROOF did not measure
            that time on your jobs.
          </p>
        </div>
        <div className="actions">
          <Link className="button" href="/offer">
            Book the Desk Trace — {DESK_TRACE_PRICE}
          </Link>
          <Link
            className="button ghost"
            href="/visualizer?from=map"
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
                return;
              }
              const sample = getDepartment(session.departmentId).sample;
              if (!scenarioDirty(session.inputs, sample)) return;
              const ok = window.confirm(
                'This Trace has edits. Opening the scan desk replaces them. A new tab skips this question.'
              );
              if (!ok) event.preventDefault();
            }}
          >
            Trace {department.name}
          </Link>
          <button
            type="button"
            className="button ghost"
            onClick={() => {
              setCursor(0);
              setMode('ask');
            }}
          >
            Review answers
          </button>
          <button
            type="button"
            className="button ghost"
            onClick={() => {
              resetMap();
              setCursor(0);
              setMode('ask');
            }}
          >
            Start again
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="map-ask">
      <p className="kicker">Agency scan · {String(question.number).padStart(2, '0')} / 15</p>
      <div className="ticks" aria-hidden="true">
        {QUESTIONS.map((item, index) => (
          <span
            key={item.id}
            className={
              session.values[index] !== null
                ? 'tick filled'
                : index === cursor
                  ? 'tick current'
                  : 'tick'
            }
          />
        ))}
      </div>
      <h1 ref={headingRef} tabIndex={-1}>
        {question.text}
      </h1>
      <div className="choices" role="group" aria-label={question.text}>
        {question.choices.map((choice, index) => {
          const selected = session.optionIds[cursor] === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              className={selected ? 'choice selected' : 'choice'}
              aria-pressed={selected}
              onClick={() => choose(choice)}
            >
              <span className="choice-key">{index + 1}</span>
              {choice.text}
            </button>
          );
        })}
      </div>
      <div className="ask-nav">
        <button
          type="button"
          className="button ghost"
          disabled={cursor === 0}
          onClick={() => setCursor(cursor - 1)}
        >
          Previous
        </button>
        {isComplete(answers) ? (
          <button type="button" className="button ghost" onClick={() => setMode('result')}>
            See the reading
          </button>
        ) : (
          <p>Keys 1–4 answer. Left arrow goes back.</p>
        )}
      </div>
    </article>
  );
}
