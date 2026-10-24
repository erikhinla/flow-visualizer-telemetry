import type { BandId, DepartmentId } from './types';

/**
 * Status, next step, owner and deadline.
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
  where: 'Status',
  what: 'Next step',
  who: 'Owner',
  when: 'Deadline',
};

export const STATE_LABEL: Record<FactState, string> = {
  held: 'On track',
  fog: 'Drift',
  friction: 'Friction',
  seized: 'Stalled',
  untraced: 'Unmapped',
};

export const STATE_LINE: Record<FactState, string> = {
  held: 'Everyone can find the status, next step, owner and deadline.',
  fog: 'Work still goes out, but people lose hours looking for files, decisions and owners.',
  friction: 'This team is almost at capacity. Work is starting to wait.',
  seized: "This team is stalled. There's more work than hours to do it.",
  untraced: 'Add real numbers for this team. Until then, this is a sample.',
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
      ["The latest version is spread across email, decks and desktops.", "The current version sits in the project folder."],
      ["Nobody's sure what the client approved or what comes next.", "The approval and the next step are written on the project."],
      ["Account Management is piecing together who signed off.", "The person who signs off is named."],
      ["The approval moves whenever the chasing stops.", "Each client approval has a due date."]
    ),
    keystones: stones(
      ["Where", "Keep only the current version in the project folder. Move old versions out."],
      ["What", "Write down what was approved, what changed and the next step."],
      ["The check", "Before anything goes to the client, check the folder, note, owner and date are there."],
      ["Who and when", "Name the owner and the date. The account lead checks back in 14 days."]
    ),
  },
  FIN: {
    facts: facts(
      ["Charges and invoices live in different systems.", "Each invoice links to the scope and sign-off behind it."],
      ["Every invoice problem gets worked out from scratch.", "A shared ID shows what still has to match."],
      ["Finance is matching records nobody owns.", "The controller names who clears each problem."],
      ["Invoice problems sit with no time limit.", "Each problem has a date it gets escalated."]
    ),
    keystones: stones(
      ["Where", "Link the scope, the sign-off and the invoice in the books."],
      ["What", "Use one shared ID and note what still has to match."],
      ["The check", "Don't close an invoice problem until the IDs match."],
      ["Who and when", "The controller names an owner and an escalation date for each problem."]
    ),
  },
  LGL: {
    facts: facts(
      ["Files lose track of their sources and rights.", "Sources and rights travel with the file."],
      ["Gaps turn up halfway through review.", "Sources, rights and sign-off are listed on the file."],
      ["Legal spends review time hunting for proof.", "The reviewer is named."],
      ["The date slips while proof gets gathered.", "Proof is attached by the review date."]
    ),
    keystones: stones(
      ["Where", "Keep the proof with the file under review."],
      ["What", "List sources, rights and sign-off on the file."],
      ["The check", "Don't start review until sources, rights and sign-off are there. Big changes restart review."],
      ["Who and when", "Name the reviewer and the date the proof is due."]
    ),
  },
  PRD: {
    facts: facts(
      ["Finals and drafts sit in the same folder.", "The final file has its own folder."],
      ["Finding the approved file is a search.", "Status, rights, name and delivery specs are on the final file."],
      ["Production hunts for the file that can ship.", "The person who marks a file final is named."],
      ["Delivery waits on the hunt.", "The final file has a delivery date."]
    ),
    keystones: stones(
      ["Where", "Give the approved final its own folder. Keep drafts out."],
      ["What", "Write status, rights, file name and delivery specs."],
      ["The check", "Don't deliver a file that isn't marked final."],
      ["Who and when", "Name who marks files final, and the delivery date."]
    ),
  },
  STR: {
    facts: facts(
      ["Notes and decks are everywhere. The actual question isn't.", "Each decision has its own short brief."],
      ["The decision gets rebuilt at every meeting.", "The question, sources, assumptions, criteria and next step are written down."],
      ["Meetings go to working out what's being decided.", "The decision owner is named."],
      ["Decisions reopen because nothing closed them.", "Each decision has a due date."]
    ),
    keystones: stones(
      ["Where", "Keep each decision in its own brief."],
      ["What", "Write the question, sources, assumptions, criteria and next step."],
      ["The check", "No decision meeting without those five."],
      ["Who and when", "Name the decision owner and the due date."]
    ),
  },
  CRT: {
    facts: facts(
      ["Feedback lives apart from the work.", "The work, the brief and the notes sit together."],
      ["The brief gets rebuilt every round.", "The approved direction and feedback are in a single note."],
      ["Creative rebuilds the brief before making anything.", "The person who signs off each round is named."],
      ["Rounds eat the time the work needed.", "Each round has a due date."]
    ),
    keystones: stones(
      ["Where", "Keep the work, the brief and the notes in one folder."],
      ["What", "Write the approved direction, the criteria and the combined feedback."],
      ["The check", "Start each new round from that note."],
      ["Who and when", "Name who signs off each round, and the due date."]
    ),
  },
  PR: {
    facts: facts(
      ["The facts and the draft are in different places.", "The facts sit with the draft."],
      ["The statement waits on facts and sign-off.", "Current facts are written on the draft."],
      ["Someone's chasing the approver.", "The approver is named."],
      ["The deadline passes during the chase.", "Each statement has a deadline."]
    ),
    keystones: stones(
      ["Where", "Keep the draft and the facts together."],
      ["What", "Write the current facts on the draft."],
      ["The check", "Don't start a draft until the facts and the approver are on the draft."],
      ["Who and when", "The communications lead names the approver and the deadline."]
    ),
  },
  MED: {
    facts: facts(
      ["The plan, the platform and the spend use different names.", "One record links the plan, the buy and the spend."],
      ["Matching numbers is the whole job.", "Shared names are set once."],
      ["Media rebuilds the numbers before anyone can read them.", "The person who sorts out mismatches is named."],
      ["Reporting runs behind the campaign.", "Mismatches are sorted by the reporting date."]
    ),
    keystones: stones(
      ["Where", "Link the plan, the buy and the spend in one record."],
      ["What", "Set shared names once."],
      ["The check", "Flag any spend with no matching plan before the report goes out."],
      ["Who and when", "Name who sorts out mismatches, and by which reporting date."]
    ),
  },
  HR: {
    facts: facts(
      ["Drafts point to an old policy, or none.", "The current policy is filed with the case."],
      ["Finding which rule applies is a search.", "The facts and the rule are written on the draft."],
      ["Human Resources double-checks policy before anything moves.", "The reviewer for exceptions is named."],
      ["Corrections arrive after the decision.", "Each case has a due date."]
    ),
    keystones: stones(
      ["Where", "File the current policy with the case."],
      ["What", "Write the facts and the rule on the draft."],
      ["The check", "No decision goes out under an old policy."],
      ["Who and when", "Name the reviewer for exceptions, and the date."]
    ),
  },
  OPS: {
    facts: facts(
      ["Handoffs have nowhere to land.", "Every handoff has a set spot where the next owner picks up the work."],
      ["Nobody's defined done.", "The next step and what counts as done are written down."],
      ["Nobody took the handoff, so someone carries the work across.", "The person who took the handoff is named."],
      ["Handoffs sit with no due date.", "Each handoff has a due date."]
    ),
    keystones: stones(
      ["Where", "Give every handoff a set spot where the next owner picks up the work."],
      ["What", "Write the next step and what counts as done."],
      ["The check", "A handoff stays open until someone accepts the work and done is checked."],
      ["Who and when", "Name the owner, who to escalate to, and the date."]
    ),
  },
};

export function deskTrace(id: DepartmentId): DeskTrace {
  return DESK_TRACE[id];
}
