'use client';

import type { AudienceId } from '../lib/audiences';

/** Canon: Context-Keystones.md, "Where most teams start". */
const KEYSTONES: ReadonlyArray<readonly [string, string]> = [
  ['Folders', 'Folders with a clear structure.'],
  ['Markdown', 'Markdown for decision logs, SOPs, and context files.'],
  ['Scripts', 'Scripts for repeatable actions.'],
  ['Protocols', 'Protocols for handoffs and checks.'],
];

/** One line per business type. "Fixed" lines are the exact wording from Erik. */
const ROUTE: Record<AudienceId, { today: string; fixed: string }> = {
  agency: { today: 'The current version is split across mail, decks, and desktops.', fixed: 'The current project sits in a single folder.' },
  consulting: { today: 'The current deck is split across email threads and desktops.', fixed: 'The current deliverable sits in the engagement folder.' },
  service: { today: 'What was promised is spread across texts, calls, and the office calendar.', fixed: 'The current quote and what was promised sit in the job folder.' },
};

export function KeystonesPreview({ audienceId, stage }: { audienceId: AudienceId; stage: string | null }) {
  const route = ROUTE[audienceId];
  return (
    <section className="px-ks" aria-labelledby="px-ks-h">
      <div className="px-ks-head">
        <h2 id="px-ks-h">Context Keystones, before and after</h2>
        <p className="px-ks-lede">
          A Context Keystone keeps the brief, decisions and status with the work, so the next person or agent doesn't have to rebuild them.
        </p>
      </div>
      <p className="px-ks-stall">
        <span>The stall</span>{' '}
        {stage ? (
          <>
            <b>{stage}</b>. The Keystones start there.
          </>
        ) : (
          <>No single stall point stood out. The Keystones apply across all the work.</>
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
        <p><span>After</span> <b>{route.fixed}</b></p>
      </div>
    </section>
  );
}
