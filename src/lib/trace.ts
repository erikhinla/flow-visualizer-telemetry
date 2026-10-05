import type { BandId, DepartmentId } from './types';

/**
 * Where the project is, what needs done, who is doing it, and by when.
 * One missing connection drops all four together. The keystones put them back.
 */
export type FactId = 'where' | 'what' | 'who' | 'when';
export type FactState = 'held' | 'fog' | 'friction' | 'seized' | 'untraced';
export type KeystoneId = 'folders' | 'markdown' | 'scripts' | 'protocols';

export interface DeskFact {
  id: FactId;
  now: string;
  held: string;
}

export interface Keystone {
  id: KeystoneId;
  name: 'Folders' | 'Markdown' | 'Scripts' | 'Protocols';
  /** Which of the four facts this stone puts back. */
  holds: string;
  action: string;
}

export interface DeskTrace {
  facts: readonly [DeskFact, DeskFact, DeskFact, DeskFact];
  keystones: readonly [Keystone, Keystone, Keystone, Keystone];
}

export const FACT_QUESTION: Record<FactId, string> = {
  where: 'Where is the project now?',
  what: 'What needs done?',
  who: 'Who is doing it?',
  when: 'By when?',
};

export const STATE_LABEL: Record<FactState, string> = {
  held: 'Held',
  fog: 'Fog',
  friction: 'Friction',
  seized: 'Stalled',
  untraced: 'Untraced',
};

export const STATE_LINE: Record<FactState, string> = {
  held: 'You can see the job. Where it is, what is next, who has it, and by when are in one place.',
  fog: 'The work is still going out. People are spending the day finding it first.',
  friction: 'The desk is bending. Waiting is starting to cost more than the work itself.',
  seized: 'This desk has stalled. There is more to do than the hours will hold.',
  untraced: 'Add this desk’s real numbers. Until then, this is only a picture of the problem.',
};

/** Hide the seat only when the desk is unknown. Unavailable keeps the seat. */
export function showSeat(band: BandId, known: boolean): boolean {
  return known && band !== 'unknown';
}

export function factState(band: BandId, repairHours: number | null): FactState {
  if (band === 'unknown' || band === 'unavailable') return 'untraced';
  if (band === 'seized') return 'seized';
  if (band === 'forming' || band === 'closing') return 'friction';
  if (band === 'fog' || (repairHours ?? 0) > 0) return 'fog';
  return 'held';
}

function facts(
  where: [string, string],
  what: [string, string],
  who: [string, string],
  when: [string, string]
): DeskTrace['facts'] {
  return [
    { id: 'where', now: where[0], held: where[1] },
    { id: 'what', now: what[0], held: what[1] },
    { id: 'who', now: who[0], held: who[1] },
    { id: 'when', now: when[0], held: when[1] },
  ];
}

function stones(
  folders: [string, string],
  markdown: [string, string],
  scripts: [string, string],
  protocols: [string, string]
): DeskTrace['keystones'] {
  return [
    { id: 'folders', name: 'Folders', holds: folders[0], action: folders[1] },
    { id: 'markdown', name: 'Markdown', holds: markdown[0], action: markdown[1] },
    { id: 'scripts', name: 'Scripts', holds: scripts[0], action: scripts[1] },
    { id: 'protocols', name: 'Protocols', holds: protocols[0], action: protocols[1] },
  ];
}

export const DESK_TRACE: Record<DepartmentId, DeskTrace> = {
  ACC: {
    facts: facts(
      [
        'The live version is split across mail, decks, and a desktop.',
        'One folder holds the current package.',
      ],
      [
        'What was approved, and what happens next, is reconstructed.',
        'The decision and the next action are written on the package.',
      ],
      ['Account is rebuilding who decided.', 'The decision owner is named on the package.'],
      ['The approval moves when the chase ends.', 'The package has a date it must move.']
    ),
    keystones: stones(
      ['Where', 'Keep only the current package in one folder. Older versions leave the live path.'],
      ['What', 'On the package, write the decision, the change, and the next action.'],
      [
        'The check',
        'Before a package moves, check that the folder, the note, the owner, and the date are present.',
      ],
      [
        'Who and when',
        'Name the owner and the date. The account lead reviews this desk in 14 days.',
      ]
    ),
  },
  FIN: {
    facts: facts(
      [
        'Charges and invoices sit in different systems.',
        'One ledger view joins scope, authorization, and the invoice.',
      ],
      [
        'The next exception is reconstructed each time.',
        'The shared identifier says what still must match.',
      ],
      [
        'Finance is matching records nobody owns.',
        'The controller names who clears the exception.',
      ],
      ['Exceptions have no watched age limit.', 'Each exception has an age at which it escalates.']
    ),
    keystones: stones(
      ['Where', 'Join scope, authorization, and the invoice in one ledger view.'],
      ['What', 'Write the shared identifier and what still must match.'],
      ['The check', 'Check the shared identifier before an exception can close.'],
      ['Who and when', 'The controller names who clears it, and the age that escalates it.']
    ),
  },
  LGL: {
    facts: facts(
      ['The version is detached from its source and rights.', 'Evidence travels with the version.'],
      [
        'Gaps are found during review, not before it.',
        'Source, rights, and approval are listed on the version.',
      ],
      ['Counsel hunts for proof instead of reviewing it.', 'The person who may review is named.'],
      ['The date slips while proof is gathered.', 'Evidence is attached by the review date.']
    ),
    keystones: stones(
      ['Where', 'File the evidence with the version under review.'],
      ['What', 'List source, rights, and approval on that version.'],
      [
        'The check',
        'Block the start of review if source, rights, or approval is absent. A material version change reopens review.',
      ],
      ['Who and when', 'Name who may review, and the date the evidence must be attached.']
    ),
  },
  PRD: {
    facts: facts(
      [
        'Masters and variants share one stack.',
        'The approved master has its own folder. Variants stay out.',
      ],
      [
        'Which file is approved is a search.',
        'Status, rights, the name, and the delivery requirements are written on the master.',
      ],
      [
        'Production hunts for the file that may ship.',
        'The person who may mark a master is named.',
      ],
      ['Delivery waits on the hunt.', 'The master carries its delivery date.']
    ),
    keystones: stones(
      ['Where', 'Put the approved master in its own folder. Leave variants out.'],
      ['What', 'Write status, rights, the file name, and the delivery requirements.'],
      ['The check', 'Refuse delivery of a file that is not marked as the master.'],
      ['Who and when', 'Name who may mark a master, and the delivery date.']
    ),
  },
  STR: {
    facts: facts(
      ['Notes and decks are everywhere. The question is not.', 'One brief folder holds the decision.'],
      [
        'The decision gets rebuilt every time the room needs it.',
        'The question, sources, assumptions, criteria, and next action are written.',
      ],
      [
        'The meeting is spent figuring out what you are deciding.',
        'The decision owner is named.',
      ],
      ['Decisions reopen because nothing closed them.', 'The decision has a due date.']
    ),
    keystones: stones(
      ['Where', 'Keep the decision in one brief folder.'],
      [
        'What',
        'Write the question, the sources, the assumptions, the criteria, and the next action.',
      ],
      ['The check', 'A decision cannot open without those five lines.'],
      ['Who and when', 'Name the decision owner and the due date.']
    ),
  },
  CRT: {
    facts: facts(
      [
        'Feedback lives apart from the work.',
        'The piece, the brief, and the live notes sit together.',
      ],
      [
        'The ask is reconstructed each round.',
        'Approved direction, criteria, and consolidated feedback are one note.',
      ],
      [
        'Creative rebuilds the brief before making the work.',
        'The person who accepts a round is named.',
      ],
      ['Rounds eat the time the craft needed.', 'The round has a due date.']
    ),
    keystones: stones(
      ['Where', 'Keep the piece, the brief, and the live notes in one place.'],
      ['What', 'Write the approved direction, the criteria, and the consolidated feedback.'],
      ['The check', 'A new round starts only from that note.'],
      ['Who and when', 'Name who accepts a round, and the due date.']
    ),
  },
  PR: {
    facts: facts(
      ['The facts and the draft live apart.', 'The draft and the evidence sit together.'],
      [
        'The response waits on what is true and who may say it.',
        'Current facts and the response type are written on the draft.',
      ],
      ['Someone is chasing the approver.', 'The approver is named.'],
      ['The window closes during the chase.', 'The response has a window.']
    ),
    keystones: stones(
      ['Where', 'Keep the draft and the evidence together.'],
      ['What', 'Write the current facts and the response type on the draft.'],
      ['The check', 'A draft cannot start until the facts and the approver are on it.'],
      ['Who and when', 'The communications lead names the approver and the window.']
    ),
  },
  MED: {
    facts: facts(
      [
        'Intent, platform, and spend use different names.',
        'One record joins the plan, the action, and the spend.',
      ],
      ['Reconciliation is the work.', 'Shared definitions are written once.'],
      [
        'Media rebuilds the trail before anyone can read it.',
        'The person who resolves a difference is named.',
      ],
      ['Reporting lags the flight.', 'Differences are resolved by the reporting date.']
    ),
    keystones: stones(
      ['Where', 'Join the plan, the action, and the spend in one record.'],
      ['What', 'Write the shared definitions once.'],
      ['The check', 'Flag a spend line that has no definition before the report goes out.'],
      ['Who and when', 'Name who resolves a difference, and by which reporting date.']
    ),
  },
  HR: {
    facts: facts(
      [
        'The draft points at an old policy, or at no situation.',
        'The governing policy is filed with the case.',
      ],
      [
        'Which rule applies is a search.',
        'The situation and the applicable rule are on the draft.',
      ],
      [
        'People operations verifies the policy before the case can move.',
        'The reviewer for exceptions is named.',
      ],
      ['Corrections arrive after the decision.', 'The case has a date.']
    ),
    keystones: stones(
      ['Where', 'File the governing policy with the case.'],
      ['What', 'Write the situation and the applicable rule on the draft.'],
      ['The check', 'A decision cannot be issued against an unmarked policy version.'],
      ['Who and when', 'Name the reviewer for exceptions, and the date.']
    ),
  },
  OPS: {
    facts: facts(
      [
        'The handoff has no accepted place to land.',
        'There is a place the next owner accepts the job.',
      ],
      ['Done is undefined.', 'The next action and the definition of done are written.'],
      [
        'Nobody accepted it, so a person bridges the gap.',
        'The owner who accepted the handoff is named.',
      ],
      ['Handoffs age with no due date.', 'The handoff has a date.']
    ),
    keystones: stones(
      ['Where', 'Give the job a place the next owner accepts.'],
      ['What', 'Write the next action and the definition of done.'],
      ['The check', 'A handoff without an accepted owner and a done-check stays open.'],
      ['Who and when', 'Name the owner, the escalation, and the date.']
    ),
  },
};

export function deskTrace(id: DepartmentId): DeskTrace {
  return DESK_TRACE[id];
}
