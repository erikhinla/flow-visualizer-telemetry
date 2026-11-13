/** Approved (i) tooltip copy. Source: tooltip-copy.md (Erik, round 7). 02 is "Stage score". */
import type { ProfileId } from './types';

export const TIP_MAP_SCORE = 'The sum of the 15 answers, from 0 to 30. It places the business in one of 4 patterns (Fragmented, Stalled, Scaling, Compounding) and is the first of the 9 measurements.';

export const TIP_LEVEL: Record<ProfileId, string> = {
  FRAGMENTED: 'People hold the work together and little of the context lives in a shared record. AI adds output, but each handoff still depends on someone remembering.',
  STALLED: 'Some context is written down, but work still waits in the gaps between steps. The basics are in place for AI to help once handoffs carry what they need.',
  SCALING: 'Work moves, but the same context is rebuilt along the way. Closing those repeats is what lets AI output flow without extra checking.',
  COMPOUNDING: 'Most of the work is connected and context travels with it. The job is keeping it that way as the team and AI output grow.',
};

/** Keyed by dimension index (P, R, O Output, O Operating capacity, F). */
export const TIP_DIMENSION: readonly string[] = [
  '3 questions, 6 of 30 points (20% of the score). Questions 1 to 3: where momentum is lost, how the next deliverable is known, and where briefs, approvals and feedback are kept.',
  '3 questions, 6 of 30 points (20% of the score). Questions 4 to 6: how many AI tools the work runs through, what happens to what the team learned, and what happens when a request gets missed.',
  '3 questions, 6 of 30 points (20% of the score). Questions 7 to 9: how clear ownership is when work moves, how AI is used today, and how decisions get made close to a deadline.',
  '3 questions, 6 of 30 points (20% of the score). Questions 10 to 12: how much depends on someone remembering, how often work gets remade or hunted for, and what happens when a key person is out.',
  '3 questions, 6 of 30 points (20% of the score). Questions 13 to 15: how visible live work and approvals are, how the team gets better at what it ships, and one word for where things stand.',
];

export const TIP_SCORING = 'Each answer scores 0, 1 or 2 and every question weighs the same, so the 5 sections count equally. Lower points show where work stalls first.';
export const TIP_REPAIR_COST = 'The paid time spent finding, checking or rebuilding work that arrived without what it needed. It prices hours already spent, not money saved.';
export const TIP_HOURLY = 'What one paid hour costs: salary divided by 2,080 working hours a year. It turns repair time into a dollar figure.';
export const TIP_ANNUAL = 'Hourly cost times repair hours times team size times 52 weeks. It shows what carrying context by hand costs over a year.';
export const TIP_THREE_OF_NINE = 'PROOF runs 01 Map score and 08 + 09 Context Repair Cost from 15 answers. The other 6 need your real work, which FACT measures.';
export const TIP_FACT_ALL_NINE = 'FACT reads real handoffs in current work and runs all 9 measurements, not the 3 PROOF can run from answers. It ends with what stalls, what it costs, what to change first, and your Context Keystones written from all nine.';
export const TIP_STAGE = 'Where work stalls first, based on your lowest answers. PROOF names a stage of work, never a team or person.';

/** The 9 measurements, one line each, for the FACT card back. */
export const NINE: ReadonlyArray<readonly [string, string, string]> = [
  ['01', 'Map score', 'Which of the 4 patterns the business runs on.'],
  ['02', 'Stage score', 'Each stage of work scored. Shows where work waits longest.'],
  ['03', 'Context-gap rate', 'Share of handoffs that arrive missing something required.'],
  ['04', 'Repair hours', 'Hours spent repairing handoffs, timed on real work.'],
  ['05', 'Capacity pressure', 'Hours the work requires against hours the team has.'],
  ['06', 'Capacity gap', 'Required hours that do not fit in the week.'],
  ['07', 'Backlog', 'Work in, work done and work dropped over time.'],
  ['08', 'Context repair cost, hourly', 'What one paid hour of repair costs.'],
  ['09', 'Context repair cost, annual', 'What carrying context by hand costs over a year.'],
];
