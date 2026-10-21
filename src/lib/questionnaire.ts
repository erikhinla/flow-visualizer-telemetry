import type { ArchetypeId, Choice, DepartmentId, PressureId, ProfileId, Question } from './types';
import { MAP_MODEL_VERSION } from './types';

export { MAP_MODEL_VERSION };

const q = (
  number: number,
  text: string,
  choices: Array<[string, 0 | 1 | 2, PressureId | null]>
): Question => ({
  id: `q${number}`,
  number,
  text,
  choices: choices.map(([choiceText, value, pressure], index): Choice => ({
    id: `q${number}-c${index + 1}`,
    text: choiceText,
    value,
    pressure,
  })) as Question['choices'],
});

/**
 * Agency wording on the 6 September 2026 point values and pressure ids.
 * Scoring is unchanged. Option ids keep equal-valued choices distinct.
 */
export const QUESTIONS: readonly Question[] = [
  q(1, 'Where does campaign work lose momentum most often?', [
    ['Getting the work started', 0, 'start'],
    ['Handoffs, or waiting on the client', 1, 'handoff'],
    ['Finishing and getting it live', 1, null],
    ['It rarely loses momentum', 2, null],
  ]),
  q(2, 'How does the team know the next deliverable?', [
    ['We figure it out as we go', 0, 'next'],
    ['We have informal priorities', 1, 'priorities'],
    ['We have a system, but it is not always followed', 1, 'priorities'],
    ['Every job has a clear next step', 2, null],
  ]),
  q(3, 'Where do the brief, the approval, and the feedback live?', [
    ["In people's heads", 0, 'memory'],
    ['In scattered docs, decks, and chats', 0, 'memory'],
    ['In a loose folder or project', 1, 'scattered'],
    ['In one record anyone on the job can open', 2, null],
  ]),
  q(4, 'How many AI tools are in the making, the media, or the reporting?', [
    ['None yet', 1, null],
    ['One or two, lightly', 1, null],
    ['Several, and they are not connected', 1, null],
    ['Several, connected, with consistent output', 2, null],
  ]),
  q(5, 'When a campaign ends, what happens to what the team learned?', [
    ['It leaves with the campaign', 0, 'learning'],
    ['Some notes are saved somewhere', 1, null],
    ['We debrief, but nothing is formal', 1, null],
    ['We capture it, and the next campaign is better', 2, null],
  ]),
  q(6, 'How does the agency handle a missed lead, RFP, or client ask?', [
    ['It usually falls through', 0, 'followup'],
    ['Someone follows up when they remember', 0, 'followup'],
    ['We have a loose process', 1, 'loose-followup'],
    ['Follow-up runs without relying on memory', 2, null],
  ]),
  q(7, 'How clear is ownership when a deliverable must move?', [
    ['Unclear. It often falls through', 0, 'ownership'],
    ['It depends on who is free', 1, 'informal-owner'],
    ['Ownership is informal', 1, 'informal-owner'],
    ['Every deliverable has an owner and a clear next step', 2, null],
  ]),
  q(8, 'How is AI used in the work today?', [
    ['Experiments, with no operating rules', 0, 'ai'],
    ['In use, but the output is inconsistent', 1, null],
    ['Workflows run, but they are fragmented', 1, null],
    ['In use, with rules and a person accountable', 2, null],
  ]),
  q(9, 'How are decisions made when a deadline is close?', [
    ['Whoever speaks loudest', 0, 'decisions'],
    ['Whoever is available', 0, 'decisions'],
    ['By loose guidelines', 1, null],
    ['By a written decision rule', 2, null],
  ]),
  q(10, 'How much revenue still depends on someone remembering to follow up?', [
    ['Almost all of it', 0, 'revenue'],
    ['Most of it', 0, 'revenue'],
    ['Some of it', 1, 'some-manual'],
    ['Very little. The system carries most of it', 2, null],
  ]),
  q(11, 'How often does the team remake or hunt for work that already exists?', [
    ['Every week', 0, 'repeat'],
    ['Most months', 0, 'repeat'],
    ['Sometimes', 1, 'sometimes-repeat'],
    ['Rarely. Masters and decisions are reusable', 2, null],
  ]),
  q(12, 'What happens when the person who knows the client best is out?', [
    ['The work stops', 0, 'key-person'],
    ['It slows sharply', 0, 'key-person'],
    ['The team copes, painfully', 1, null],
    ['The work continues', 2, null],
  ]),
  q(13, 'How visible are live jobs and approvals right now?', [
    ['Not visible', 0, 'pipeline'],
    ['Partly visible', 1, 'partial-pipe'],
    ['Mostly visible', 1, 'partial-pipe'],
    ['Visible as they change', 2, null],
  ]),
  q(14, 'How does the agency get better at the work it ships?', [
    ["It doesn't", 0, 'loop'],
    ['Informally, in conversation', 1, null],
    ['We review sometimes', 1, null],
    ['We review results and change how the next job runs', 2, null],
  ]),
  q(15, 'Which word best describes the agency today?', [
    ['Chaotic', 0, 'shape'],
    ['Reactive', 0, 'shape'],
    ['Steady', 1, null],
    ['Improving each month', 2, null],
  ]),
];

export const PRESSURE_LABEL: Record<PressureId, string> = {
  start: 'Jobs stall before the work starts',
  handoff: 'Momentum drops between tools, people, or the client',
  next: 'The next deliverable is figured out in the moment',
  priorities: 'Priorities exist, but only informally',
  memory: 'The brief, the approval, or the feedback lives in people',
  scattered: 'The job record is loosely organized',
  tools: 'AI tools are not in the making, media, or reporting yet',
  learning: 'What a campaign taught the team leaves with the campaign',
  followup: 'Leads, RFPs, or client asks fall through or wait on memory',
  'loose-followup': 'Follow-up has a loose process',
  ownership: 'Ownership is unclear when a deliverable must move',
  'informal-owner': 'Ownership depends on who is free',
  ai: 'AI is in the work without operating rules',
  decisions: 'Deadline decisions have no written rule',
  revenue: 'Revenue still depends on someone remembering to follow up',
  'some-manual': 'Some revenue still depends on manual follow-up',
  repeat: 'The team remakes or hunts for work that already exists',
  'sometimes-repeat': 'Repeat production still shows up',
  'key-person': 'One person out stops or sharply slows the client or the craft',
  pipeline: 'Live jobs and approvals cannot be seen',
  'partial-pipe': 'Live work is only partly visible',
  loop: 'Shipped work does not change how the next job runs',
  shape: 'The agency is described as chaotic or reactive',
};

/** Shown when a finished scan selected no pressure. A label, not a finding. */
export const ARCHETYPE_FALLBACK =
  'No pressure was selected. This is a default hint, not a finding that the work is fragmented.';

export const ARCHETYPE_LABEL: Record<ArchetypeId, string> = {
  bottleneckOperator: 'A person is still the routing system',
  toolOverload: 'Tools or handoffs are the first place to check',
  executionStall: 'Starting, the next deliverable, or the learning loop stalls',
  fragmentedWorkflow: 'The answers point to scattered campaign coordination',
};

export const PROFILE_COPY: Record<ProfileId, string> = {
  FRAGMENTED: 'Answers suggest the campaign is coordinated by people, not by a shared record.',
  STALLED: 'Answers suggest gaps between brief, making, approval, and live.',
  SCALING: 'Answers suggest repeated production and reconciliation that can come down.',
  COMPOUNDING: 'Answers suggest new tools can stay tied to an agency that is already connected.',
};

export const PROFILE_HOURS: Record<ProfileId, { low: number; high: number }> = {
  FRAGMENTED: { low: 6, high: 12 },
  STALLED: { low: 4, high: 8 },
  SCALING: { low: 2, high: 5 },
  COMPOUNDING: { low: 1, high: 3 },
};

/** Saved website destinations. They are references, not routes in this app. */
export function savedDestination(profile: ProfileId): string {
  if (profile === 'FRAGMENTED' || profile === 'STALLED') {
    return '/tbtx/blueprint';
  }
  return '/bbai';
}

export interface MapAnswers {
  /** Point value, or null when that question has not been answered. */
  values: Array<0 | 1 | 2 | null>;
  optionIds: Array<string | null>;
}

export function emptyAnswers(): MapAnswers {
  return {
    values: Array.from({ length: QUESTIONS.length }, () => null),
    optionIds: Array.from({ length: QUESTIONS.length }, () => null),
  };
}

export function isComplete(answers: MapAnswers): boolean {
  return (
    answers.values.length === QUESTIONS.length &&
    answers.optionIds.length === QUESTIONS.length &&
    QUESTIONS.every((question, index) =>
      question.choices.some((choice) =>
        choice.id === answers.optionIds[index] && choice.value === answers.values[index]
      )
    )
  );
}

export interface MapScore {
  raw: number;
  /** Rounded answer index from 0 to 100. Not a measured health percentage. */
  index: number;
  profile: ProfileId;
  /** First four pressures for display only. */
  pressures: PressureId[];
  /** All pressures in saved priority order, retained for the portable record. */
  allPressures: PressureId[];
  archetype: ArchetypeId | null;
  destination: string;
}

export function scoreMap(answers: MapAnswers): MapScore | null {
  if (!isComplete(answers)) return null;

  let raw = 0;
  const zeros: PressureId[] = [];
  const ones: PressureId[] = [];

  QUESTIONS.forEach((question, index) => {
    const value = answers.values[index];
    if (value === null) return;
    raw += value;
    const choice = question.choices.find((item) => item.id === answers.optionIds[index]);
    const pressure = choice?.pressure ?? null;
    if (value === 0 && pressure) zeros.push(pressure);
    if (value === 1 && pressure) ones.push(pressure);
  });

  const allPressures = [...zeros, ...ones];
  const pressures = allPressures.slice(0, 4);
  const index = Math.round((100 * raw) / 30);

  return {
    raw,
    index,
    profile: profileFor(raw),
    pressures,
    allPressures,
    archetype: archetypeFor(allPressures),
    destination: savedDestination(profileFor(raw)),
  };
}

export function profileFor(raw: number): ProfileId {
  if (raw <= 7) return 'FRAGMENTED';
  if (raw <= 14) return 'STALLED';
  if (raw <= 22) return 'SCALING';
  return 'COMPOUNDING';
}

export function archetypeFor(pressures: readonly PressureId[]): ArchetypeId | null {
  if (pressures.length === 0) return null;
  const has = (ids: PressureId[]) => ids.some((id) => pressures.includes(id));
  if (has(['key-person', 'ownership', 'informal-owner'])) return 'bottleneckOperator';
  if (has(['tools', 'handoff'])) return 'toolOverload';
  if (has(['start', 'loop', 'next'])) return 'executionStall';
  return 'fragmentedWorkflow';
}

export function teamHours(profile: ProfileId, people: number): { low: number; high: number } {
  const count = clampTeam(people);
  const range = PROFILE_HOURS[profile];
  return { low: range.low * count, high: range.high * count };
}

/** Saved helper: round and clamp a supplied team count to 1–50. */
export function clampTeam(people: number): number {
  if (!Number.isFinite(people)) return 1;
  return Math.min(50, Math.max(1, Math.round(people)));
}

const PRESSURE_DEPARTMENT: Record<PressureId, DepartmentId> = {
  start: 'OPS',
  handoff: 'ACC',
  next: 'OPS',
  priorities: 'OPS',
  memory: 'ACC',
  scattered: 'ACC',
  tools: 'STR',
  learning: 'STR',
  followup: 'ACC',
  'loose-followup': 'ACC',
  ownership: 'OPS',
  'informal-owner': 'OPS',
  ai: 'STR',
  decisions: 'STR',
  revenue: 'FIN',
  'some-manual': 'FIN',
  repeat: 'PRD',
  'sometimes-repeat': 'PRD',
  'key-person': 'HR',
  pipeline: 'MED',
  'partial-pipe': 'MED',
  loop: 'STR',
  shape: 'OPS',
};

/** A starting department for the first pressure. A hint, not a finding. */
export function suggestDepartment(pressures: readonly PressureId[]): DepartmentId | null {
  const first = pressures[0];
  if (!first) return null;
  return PRESSURE_DEPARTMENT[first];
}
