'use client';

import type { AudienceId } from '../lib/audiences';

/** Canon: Context-Keystones.md, "Where most teams start". */
const KEYSTONES: ReadonlyArray<readonly [string, string]> = [
  ['Folders', 'Folders with a clear structure.'],
  ['Markdown', 'Markdown for decision logs, SOPs, and context files.'],
  ['Scripts', 'Scripts for repeatable actions.'],
  ['Protocols', 'Protocols for handoffs and checks.'],
];

/** One line per business type. "Fixed" lines are Erik's exact wording. */
const ROUTE: Record<AudienceId, { today: string; fixed: string }> = {
  agency: { today: 'The current version is split across mail, decks, and desktops.', fixed: 'One folder holds the current project.' },
  consulting: { today: 'The current deck is split across email threads and desktops.', fixed: 'One engagement folder holds the current deliverable.' },
  service: { today: 'What was promised is spread across texts, calls, and the office calendar.', fixed: 'One job folder holds the current quote and the promise.' },
};

export function KeystonesPreview({ audienceId, stage }: { audienceId: AudienceId; stage: string | null }) {
  const route = ROUTE[audienceId];
  return (
    <section className="px-ks" aria-labelledby="px-ks-h">
      <div className="px-ks-head">
        <h2 id="px-ks-h">What a fix looks like</h2>
        <p className="px-ks-lede">
          A Context Keystone holds the context your team needs, so the next person or agent can act without rebuilding it. Handoffs carry their own context. Agents run on what was actually decided.
        </p>
      </div>
      <p className="px-ks-stall">
        <span>Your stall</span>{' '}
        {stage ? (
          <>
            <b>{stage}</b>. The Keystones start there.
          </>
        ) : (
          <>No single stall point stood out. The Keystones hold context across the whole route.</>
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
    </section>
  );
}
