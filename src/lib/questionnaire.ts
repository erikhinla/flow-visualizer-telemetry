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
 * Saved Momentum Map, September 6 2026.
 * Point values are unchanged. Option ids keep equal-valued choices distinct.
 * Pressure ids follow the saved value table: both choices with the same
 * point value share that value's pressure id.
 */
export const QUESTIONS: readonly Question[] = [
  q(1, 'Where does your business lose momentum most often?', [
    ['Starting things', 0, 'start'],
    ['Switching between tools', 1, 'handoff'],
    ['Waiting on others', 1, 'handoff'],
    ['Finishing', 2, null],
  ]),
  q(2, 'How does your team know what to work on next?', [
    ['We figure it out as we go', 0, 'next'],
    ['We have informal priorities', 1, 'priorities'],
    ["We've got a system, but it isn't always followed", 1, 'priorities'],
    ['We have a clear routing process', 2, null],
  ]),
  q(3, 'Where does your team keep the knowledge it needs?', [
    ["In people's heads", 0, 'memory'],
    ['In scattered docs and chats', 0, 'memory'],
    ['In a loosely organized system', 1, 'scattered'],
    ['In a structured, accessible system', 2, null],
  ]),
  q(4, 'How many AI agents and tools do you use?', [
    ['None yet', 0, 'tools'],
    ['One or two, lightly', 1, null],
    ["Several, but they aren't connected", 1, null],
    ['Several, connected and producing consistent output', 2, null],
  ]),
  q(5, 'When a project ends, what happens to what was learned?', [
    ['It disappears with the project', 0, 'learning'],
    ['Some notes get saved somewhere', 1, null],
    ['We debrief but nothing formal', 1, null],
    ['We capture it and it improves future work', 2, null],
  ]),
  q(6, 'How does your business handle missed leads or unanswered inquiries?', [
    ['They usually fall through the cracks', 0, 'followup'],
    ['We follow up manually when we remember', 0, 'followup'],
    ['We have a loose process', 1, 'loose-followup'],
    ['We have automated follow-up', 2, null],
  ]),
  q(7, 'How clear is ownership when something needs to get done?', [
    ['Unclear - it often falls through', 0, 'ownership'],
    ['It depends on who is available', 1, 'informal-owner'],
    ['We have informal ownership', 1, 'informal-owner'],
    ['Every task has a clear owner and routing rule', 2, null],
  ]),
  q(8, 'How do AI agents and tools fit into your work?', [
    ['Experimenting with no system', 0, 'ai'],
    ['Using tools but results are inconsistent', 1, null],
    ['Running workflows but they are fragmented', 1, null],
    ['Using AI agents and tools with clear rules and oversight', 2, null],
  ]),
  q(9, 'How does your business make decisions under pressure?', [
    ['Whoever speaks loudest', 0, 'decisions'],
    ['By whoever is available', 0, 'decisions'],
    ['Using loose guidelines', 1, null],
    ['Using documented decision rules', 2, null],
  ]),
  q(10, 'How much of your revenue depends on manual follow-up or human memory?', [
    ['Almost all of it', 0, 'revenue'],
    ['Most of it', 0, 'revenue'],
    ['Some of it', 1, 'some-manual'],
    ['Very little - systems handle most of it', 2, null],
  ]),
  q(11, 'How often does your team repeat work that has already been done?', [
    ['Frequently', 0, 'repeat'],
    ['Often', 0, 'repeat'],
    ['Sometimes', 1, 'sometimes-repeat'],
    ['Rarely - we have reusable systems', 2, null],
  ]),
  q(12, 'What happens when a key person is unavailable?', [
    ['Work stops', 0, 'key-person'],
    ['Things slow down significantly', 0, 'key-person'],
    ["We manage, but it's painful", 1, null],
    ['The system continues without disruption', 2, null],
  ]),
  q(13, 'How visible is your pipeline or lead flow at any given moment?', [
    ['Not visible at all', 0, 'pipeline'],
    ['Partially visible', 1, 'partial-pipe'],
    ['Mostly visible', 1, 'partial-pipe'],
    ['Fully visible with real-time tracking', 2, null],
  ]),
  q(14, 'How does your business improve from what it executes?', [
    ["It doesn't", 0, 'loop'],
    ['Informally, through conversation', 1, null],
    ['We review occasionally', 1, null],
    ['We review results and update how we work', 2, null],
  ]),
  q(15, 'Which word best describes how work runs today?', [
    ['Chaos', 0, 'shape'],
    ['Reactive', 0, 'shape'],
    ['Building', 1, null],
    ['Compounding', 2, null],
  ]),
];

export const PRESSURE_LABEL: Record<PressureId, string> = {
  start: 'Work stalls before it starts',
  handoff: 'Momentum drops when work changes tools or hands',
  next: 'The next action is figured out in the moment',
  priorities: 'Priorities exist, but only informally',
  memory: 'Knowledge the work needs lives in people',
  scattered: 'The record of the work is loosely organized',
  tools: 'AI tools are not in the work yet',
  learning: 'What a project learned leaves with the project',
  followup: 'Inquiries fall through or wait on memory',
  'loose-followup': 'Follow-up has a loose process',
  ownership: 'Ownership is unclear when something must move',
  'informal-owner': 'Ownership depends on who is around',
  ai: 'AI is in use without operating rules',
  decisions: 'Pressure decisions have no written rule',
  revenue: 'Revenue still depends on manual follow-up',
  'some-manual': 'Some revenue still depends on manual follow-up',
  repeat: 'The team repeats work that was already done',
  'sometimes-repeat': 'Repeat work still shows up',
  'key-person': 'A missing person stops or severely slows the work',
  pipeline: 'The pipeline cannot be seen',
  'partial-pipe': 'The pipeline is only partly visible',
  loop: 'Finished work does not change how work runs',
  shape: 'Work is described as chaos or reaction',
};

export const ARCHETYPE_LABEL: Record<ArchetypeId, string> = {
  bottleneckOperator: 'Ownership sits with a person',
  toolOverload: 'Tools or handoffs are the first place to check',
  executionStall: 'Starting, the next step, or the learning loop stalls',
  fragmentedWorkflow: 'The answers point toward scattered coordination',
};

export const PROFILE_COPY: Record<ProfileId, string> = {
  FRAGMENTED: 'Answers suggest scattered coordination.',
  STALLED: 'Answers suggest gaps between steps.',
  SCALING: 'Answers suggest chances to reduce work that repeats.',
  COMPOUNDING: 'Answers suggest keeping new tools aligned with a setup that is already connected.',
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
    answers.values.every((value) => value !== null)
  );
}

export interface MapScore {
  raw: number;
  /** Rounded answer index from 0 to 100. Not a measured health percentage. */
  index: number;
  profile: ProfileId;
  pressures: PressureId[];
  archetype: ArchetypeId;
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

  const pressures = [...zeros, ...ones].slice(0, 4);
  const index = Math.round((100 * raw) / 30);

  return {
    raw,
    index,
    profile: profileFor(raw),
    pressures,
    archetype: archetypeFor(pressures),
    destination: savedDestination(profileFor(raw)),
  };
}

export function profileFor(raw: number): ProfileId {
  if (raw <= 7) return 'FRAGMENTED';
  if (raw <= 14) return 'STALLED';
  if (raw <= 22) return 'SCALING';
  return 'COMPOUNDING';
}

export function archetypeFor(pressures: readonly PressureId[]): ArchetypeId {
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
export function suggestDepartment(pressures: readonly PressureId[]): DepartmentId {
  const first = pressures[0];
  if (!first) return 'ACC';
  return PRESSURE_DEPARTMENT[first];
}
