'use client';

import { AUDIENCES, type AudienceId } from '../lib/audiences';
import { suggestDepartment } from '../lib/questionnaire';
import { FACT_QUESTION, type KeystoneId } from '../lib/trace';
import { deskTraceFor } from '../lib/traceAudience';
import type { PressureId } from '../lib/types';

const REVIEW_URL = 'https://calendar.app.google/ecuH2cxigdh5NQKy9';

/** Canon: Context-Keystones.md, "Where most teams start". */
const CANON: Record<KeystoneId, string> = {
  folders: 'Folders with a clear structure.',
  markdown: 'Markdown for decision logs, SOPs, and context files.',
  scripts: 'Scripts for repeatable actions.',
  protocols: 'Protocols for handoffs and checks.',
};

const LADDER: ReadonlyArray<readonly [string, string]> = [
  ['PROOF', 'Free. 15 answers. Your map. You are here.'],
  ['Review your PROOF', 'Free. 45 minutes. We go through your map and your stall point.'],
  ['Friction Audit', 'Paid. 2 weeks. Delivers your FACT report and your BizBlueprint.'],
  ['BizBlueprint', 'Names the Keystones your route needs, and where each one goes.'],
  ['Install', 'BizBuilders AI installs your Keystones.'],
  ['The Pipeline Airlock', 'Built by BizBuilders AI.'],
];

export function KeystonesPreview({
  audienceId,
  pressures,
  allPressures,
}: {
  audienceId: AudienceId;
  pressures: readonly PressureId[];
  allPressures: readonly PressureId[];
}) {
  const audience = AUDIENCES[audienceId];
  const dept = suggestDepartment(allPressures) ?? 'ACC';
  const where = audience.department[dept];
  const trace = deskTraceFor(audienceId, dept);
  const stall = pressures[0] ? audience.pressure[pressures[0]] : null;

  return (
    <section className="px-ks" aria-labelledby="px-ks-h">
      <div className="px-ks-head">
        <p className="px-kicker">After PROOF</p>
        <h2 id="px-ks-h">What fixed looks like</h2>
        <p className="px-ks-lede">
          A Context Keystone is any artifact that holds the context a team needs, so the next person or agent can act without rebuilding it. Handoffs carry their own context. Agents run on what was actually decided.
        </p>
      </div>

      <p className="px-ks-stall">
        <span>Your stall</span> <b>{where}</b>
        {stall ? <> · {stall}</> : null}
      </p>

      <ol className="px-ks-cards">
        {trace.keystones.map((stone, i) => (
          <li key={stone.id}>
            <p className="px-ks-no">{String(i + 1).padStart(2, '0')} · Keystone</p>
            <h3>{stone.name}</h3>
            <p className="px-ks-canon">{CANON[stone.id]}</p>
            <p className="px-ks-holds"><span>Puts back</span> {stone.holds}</p>
            <p className="px-ks-act"><span>In {where.toLowerCase()}</span> {stone.action}</p>
          </li>
        ))}
      </ol>

      <div className="px-ks-route" role="table" aria-label="Your route, before and after">
        <div className="px-ks-row px-ks-row-head" role="row">
          <span role="columnheader">The question</span>
          <span role="columnheader">Today: carried by people</span>
          <span role="columnheader">Fixed: held by the system</span>
        </div>
        {trace.facts.map((fact) => (
          <div className="px-ks-row" role="row" key={fact.id}>
            <span role="cell" className="px-ks-q">{FACT_QUESTION[fact.id]}</span>
            <span role="cell" className="px-ks-now">{fact.now}</span>
            <span role="cell" className="px-ks-held">{fact.held}</span>
          </div>
        ))}
      </div>

      <ol className="px-ks-ladder" aria-label="From PROOF to installed Keystones">
        {LADDER.map(([name, line], i) => (
          <li key={name} className={i === 0 ? 'is-here' : undefined}>
            <span className="px-no">{String(i + 1).padStart(2, '0')}</span>
            <strong>{name}</strong>
            <em>{line}</em>
          </li>
        ))}
      </ol>

      <div className="px-actions">
        <a className="px-btn px-btn-light" href={REVIEW_URL} target="_blank" rel="noopener">
          Review your PROOF
          <svg className="px-arrow" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><path d="M0 6h16M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
        </a>
        <p className="px-meta">Free · 45 minutes</p>
      </div>
    </section>
  );
}
