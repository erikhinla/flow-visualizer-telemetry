'use client';

import type { AudienceId } from '../lib/audiences';

const REVIEW_URL = 'https://calendar.app.google/ecuH2cxigdh5NQKy9';

/** Canon: Context-Keystones.md, "Where most teams start". */
const KEYSTONES: ReadonlyArray<readonly [string, string]> = [
  ['Folders', 'Folders with a clear structure.'],
  ['Markdown', 'Markdown for decision logs, SOPs, and context files.'],
  ['Scripts', 'Scripts for repeatable actions.'],
  ['Protocols', 'Protocols for handoffs and checks.'],
];

/** One line per business type. "Fixed" lines are Erik's exact wording. */
const ROUTE: Record<AudienceId, { today: string; fixed: string }> = {
  agency: {
    today: 'The current version is split across mail, decks, and desktops.',
    fixed: 'One folder holds the current project.',
  },
  consulting: {
    today: 'The current deck is split across email threads and desktops.',
    fixed: 'One engagement folder holds the current deliverable.',
  },
  service: {
    today: 'What was promised is spread across texts, calls, and the office calendar.',
    fixed: 'One job folder holds the current quote and the promise.',
  },
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
  where,
  first,
}: {
  audienceId: AudienceId;
  /** Department name from the answers, or null when no stall point was flagged. */
  where: string | null;
  first: string | null;
}) {
  const route = ROUTE[audienceId];
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
        {where && first ? (
          <>
            <span>Your stall</span> <b>{where}</b> · {first}. The Keystones start there.
          </>
        ) : (
          <>
            <span>Your stall</span> No single stall point stood out. The Keystones hold context across the whole route.
          </>
        )}
      </p>

      <ol className="px-ks-cards">
        {KEYSTONES.map(([name, line], i) => (
          <li key={name}>
            <p className="px-ks-no">{String(i + 1).padStart(2, '0')} · Keystone</p>
            <h3>{name}</h3>
            <p className="px-ks-canon">{line}</p>
          </li>
        ))}
      </ol>

      <div className="px-ks-ba">
        <p><span>Today</span> {route.today}</p>
        <p><span>Fixed</span> <b>{route.fixed}</b></p>
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
