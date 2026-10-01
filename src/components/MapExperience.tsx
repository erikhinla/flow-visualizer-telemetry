'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { trace } from '../lib/diagnostics';
import { formatHours } from '../lib/format';
import {
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
import type { Choice } from '../lib/types';
import { getDepartment } from '../lib/departments';
import { useSession } from './SessionProvider';

export function MapExperience() {
  const { ready, session, setSession, resetMap } = useSession();
  const [cursor, setCursor] = useState(0);
  const [mode, setMode] = useState<'ask' | 'result'>('ask');

  const choose = useCallback(
    (choice: Choice) => {
      setSession((current) => {
        const values = [...current.values];
        const optionIds = [...current.optionIds];
        values[cursor] = choice.value;
        optionIds[cursor] = choice.id;
        const done = values.every((value) => value !== null);
        if (done) trace('map', 'state', { event: 'map-complete' });
        return { ...current, values, optionIds, mapCompleted: done || current.mapCompleted };
      });
      if (cursor < QUESTIONS.length - 1) setCursor(cursor + 1);
      else setMode('result');
    },
    [cursor, setSession]
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
        <h1>{score.profile}</h1>
        <p className="lede">{PROFILE_COPY[score.profile]}</p>
        <dl className="score-block">
          <div>
            <dt>Raw score</dt>
            <dd>
              {score.raw}
              <span> / 30</span>
            </dd>
          </div>
          <div>
            <dt>Answer index</dt>
            <dd>
              {score.index}
              <span> / 100</span>
            </dd>
          </div>
        </dl>
        <p className="note">
          The index is the rounded share of the raw score. It is not a health percentage, a maturity
          rating, or momentum recovered.
        </p>
        <h2>Places to check</h2>
        <p className="note">
          Zero-point answers come first, then one-point answers. These are the first four. Two-point
          answers add no pressure.
        </p>
        {score.pressures.length === 0 ? (
          <p>No pressure was selected. The default archetype is still fragmented workflow.</p>
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
        <p className="archetype">
          <span>Routing hint</span>
          {ARCHETYPE_LABEL[score.archetype]}
          <code>{score.archetype}</code>
        </p>
        <div className="team">
          <label htmlFor="team-size">
            People in the preset hour range
            <strong>{clampTeam(session.teamSize)}</strong>
          </label>
          <input
            id="team-size"
            type="range"
            min={1}
            max={20}
            value={Math.min(20, clampTeam(session.teamSize))}
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
          <Link className="button" href="/visualizer?from=map">
            Open the {department.name} desk
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
      <h1>{question.text}</h1>
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
