import { ARCHETYPE_LABEL, PRESSURE_LABEL, PROFILE_COPY, QUESTIONS } from './questionnaire';
import type { ArchetypeId, DepartmentId, PressureId, ProfileId } from './types';

/**
 * Audience wording for the same 15 answers.
 * Only visible text changes. Question ids, choice ids, point values, pressure ids,
 * bands and archetype precedence come from questionnaire.ts and never change here.
 */
export type AudienceId = 'agency' | 'consulting' | 'service';

export interface Audience {
  id: AudienceId;
  /** Dropdown label. */
  label: string;
  /** Short noun for the business, used in sentences. */
  business: string;
  /** Who the work is for. */
  client: string;
  /** One recognisable moment of Digital Fog, in this audience's words. */
  moment: string;
  /** Intro headline: the question line, in this audience's words. */
  headQuestion: string;
  /** Intro subhead: the leak, then what PROOF shows. */
  lede: readonly [string, string];
  /** 15 question lines, in canonical order. */
  questions: readonly string[];
  /** 15 x 4 choice lines, in canonical order. */
  choices: readonly (readonly [string, string, string, string])[];
  pressure: Record<PressureId, string>;
  archetype: Record<ArchetypeId, string>;
  profile: Record<ProfileId, string>;
  /** Where the first pressure usually sits, named the way this audience names it. */
  department: Record<DepartmentId, string>;
}

const noDash = (text: string) => text.replace(/\s*[\u2014\u2013]\s*/g, '. ').replace(/\.\s+([a-z])/g, (_m, c: string) => `. ${c.toUpperCase()}`);

const agencyChoices = QUESTIONS.map(
  (question) => question.choices.map((choice) => noDash(choice.text)) as unknown as [string, string, string, string]
);

const AGENCY: Audience = {
  id: 'agency',
  label: 'Marketing / ad agency',
  business: 'agency',
  client: 'client',
  moment:
    'The client asks where the approval stands. Someone rebuilds the answer from Slack, email and memory.',
  headQuestion: 'So everyone became one.',
  lede: ['AI sped up the work, but context still gets carried by hand from first brief to final delivery.', '15 answers map the route, show where fog and friction stall it, and get your people back to the work they were hired for.'],
  questions: QUESTIONS.map((question) => noDash(question.text)),
  choices: agencyChoices,
  pressure: PRESSURE_LABEL,
  archetype: ARCHETYPE_LABEL,
  profile: PROFILE_COPY,
  department: {
    ACC: 'Account management',
    FIN: 'Finance',
    LGL: 'Legal',
    PRD: 'Production',
    STR: 'Strategy',
    CRT: 'Creative',
    PR: 'Public relations',
    MED: 'Media',
    HR: 'People',
    OPS: 'Operations',
  },
};

const CONSULTING: Audience = {
  id: 'consulting',
  label: 'Consulting firm',
  business: 'firm',
  client: 'client',
  moment:
    'The client asks which version of the deck is final. Someone rebuilds the answer from three email threads.',
  headQuestion: 'So everyone became one.',
  lede: ['AI sped up the work, but context still gets carried by hand from engagement kickoff to final deliverable.', '15 answers map the route, show where fog and friction stall it, and get your people back to the work they were hired for.'],
  questions: [
    'Where does client work lose momentum most often?',
    'How does the team know the next deliverable?',
    'Where do the scope, the client sign-off, and the feedback live?',
    'How many AI tools are in the research, the deliverables, or the reporting?',
    'When an engagement ends, what happens to what the team learned?',
    'How does the firm handle a missed lead, proposal request, or client ask?',
    'How clear is ownership when a deliverable has to move?',
    'How do AI tools sit inside client work?',
    'How are decisions made when a client deadline is pressing?',
    'How much revenue still depends on someone remembering to follow up?',
    'How often does someone rebuild a deck, model, or analysis that already existed?',
    'What happens when the partner who holds the client is out?',
    'How visible are live engagements, proposals, and sign-offs right now?',
    'How does the firm get better at the work it delivers?',
    'Which word best describes the practice today?',
  ],
  choices: [
    ['Getting the engagement started', 'Switching tools or consultants', 'Waiting on the client or a teammate', 'Finishing and delivering it'],
    ['We figure it out as we go', 'We have informal priorities', "We have a system, but it isn't always followed", 'Every engagement has a clear next step'],
    ["In people's heads", 'In scattered docs, decks, and email threads', 'In a loose folder or project', 'In one record the next consultant can open'],
    ['None yet', 'One or two, lightly', "Several, and they aren't connected", 'Several, connected, with consistent output'],
    ['It leaves with the engagement', 'Some notes are saved somewhere', 'We debrief, but nothing is formal', 'We capture it, and the next engagement starts smarter'],
    ['It usually falls through', 'Someone follows up when they remember', 'We have a loose process', 'Follow-up runs without relying on memory'],
    ['Unclear. It often falls through', "It depends on who's free", 'Ownership is informal', 'Every deliverable has an owner and a routing rule'],
    ['Experiments, with no operating rules', 'In use, but the output is inconsistent', "Workflows run, but they're fragmented", 'In use, with rules and a person accountable'],
    ['Whoever speaks loudest', "Whoever's available", 'By loose guidelines', 'By a written decision rule'],
    ['Almost all of it', 'Most of it', 'Some of it', 'Very little. The system carries most of it'],
    ['Frequently', 'Often', 'Sometimes', 'Rarely. Past work and templates are reusable'],
    ['The work stops', 'It slows sharply', 'The team copes, painfully', 'The work continues'],
    ['Not visible', 'Partly visible', 'Mostly visible', 'Visible as they change'],
    ["It doesn't", 'Informally, in conversation', 'We review sometimes', 'We review results and change how the next engagement runs'],
    ['Chaos', 'Reactive', 'Building', 'Compounding'],
  ],
  pressure: {
    start: 'Engagements stall before the work starts',
    handoff: 'Momentum drops between tools, consultants, or the client',
    next: 'The next deliverable is figured out in the moment',
    priorities: 'Priorities exist, but only informally',
    memory: 'Scope, sign-off, or feedback lives in people',
    scattered: 'The engagement record is loosely organized',
    tools: "AI tools aren't in the research, deliverables, or reporting yet",
    learning: 'What an engagement taught the team leaves with it',
    followup: 'Leads, proposal requests, or client asks wait on memory',
    'loose-followup': 'Follow-up has a loose process',
    ownership: 'Ownership is unclear when a deliverable has to move',
    'informal-owner': "Ownership depends on who's free",
    ai: 'AI is in client work without operating rules',
    decisions: 'Deadline decisions have no written rule',
    revenue: 'Revenue still depends on someone remembering to follow up',
    'some-manual': 'Some revenue still depends on manual follow-up',
    repeat: 'Decks, models, or analysis get rebuilt from scratch',
    'sometimes-repeat': 'Rebuilding past work still shows up',
    'key-person': 'One partner out stops or sharply slows the client work',
    pipeline: "Live engagements, proposals, and sign-offs can't be seen",
    'partial-pipe': 'Live work is only partly visible',
    loop: "Delivered work doesn't change how the next engagement runs",
    shape: 'The practice is described as chaos or reaction',
  },
  archetype: {
    bottleneckOperator: 'A person is still the routing system',
    toolOverload: 'Tools or handoffs are the first place to check',
    executionStall: 'Starting, the next deliverable, or the learning loop stalls',
    fragmentedWorkflow: 'The answers point to scattered engagement coordination',
  },
  profile: {
    FRAGMENTED: 'Answers suggest engagements are held together by people, not by a shared record.',
    STALLED: 'Answers suggest gaps between scope, delivery, sign-off, and handover.',
    SCALING: 'Answers suggest rebuilt work and reconciliation that can come down.',
    COMPOUNDING: 'Answers suggest new tools can stay tied to a practice that is already connected.',
  },
  department: {
    ACC: 'Client management',
    FIN: 'Billing',
    LGL: 'Contracts',
    PRD: 'Delivery',
    STR: 'Strategy',
    CRT: 'Content',
    PR: 'Communications',
    MED: 'Pipeline and reporting',
    HR: 'People',
    OPS: 'Operations',
  },
};

const SERVICE: Audience = {
  id: 'service',
  label: 'Service business',
  business: 'business',
  client: 'customer',
  moment:
    'A customer calls about their quote. Someone digs through texts and the office calendar to find what was promised.',
  headQuestion: 'So everyone became one.',
  lede: ['AI sped up the work, but context still gets carried by hand from first call to finished job.', '15 answers map the route, show where fog and friction stall it, and get your people back to the work they were hired for.'],
  questions: [
    'Where does a customer job lose momentum most often?',
    'How does the crew know the next job or task?',
    "Where do the quote, the customer's approval, and the job notes live?",
    'How many AI tools are in your quotes, scheduling, marketing, or follow-up?',
    'When a job wraps, what happens to what the crew learned?',
    'How does the business handle a missed call, quote request, or customer question?',
    'How clear is ownership when a job has to move to the next step?',
    'How do AI tools sit inside the day-to-day work?',
    'How are decisions made when a customer or the schedule is pressing?',
    'How much revenue still depends on someone remembering to follow up?',
    'How often does someone redo a quote, a form, or a job that already existed?',
    'What happens when the owner or lead tech is out?',
    'How visible are booked jobs, open quotes, and approvals right now?',
    'How does the business get better at the jobs it does?',
    'Which word best describes the business today?',
  ],
  choices: [
    ['Getting the job booked and started', 'Switching between apps, the office, and the field', 'Waiting on the customer, a part, or another crew', 'Closing out the job'],
    ['We figure it out as we go', 'We have informal priorities', "We have a schedule, but it isn't always followed", 'Every job has a clear next step'],
    ["In people's heads", 'In texts, emails, and paper', 'In a loose folder or app', 'In one job record anyone on the crew can open'],
    ['None yet', 'One or two, lightly', "Several, and they aren't connected", 'Several, connected, with consistent output'],
    ['It leaves with the job', 'Some notes are saved somewhere', "We talk about it, but nothing's written down", 'We capture it, and the next job runs better'],
    ['It usually falls through', 'Someone calls back when they remember', 'We have a loose process', 'Follow-up runs without relying on memory'],
    ['Unclear. It often falls through', "It depends on who's free", 'Ownership is informal', 'Every job has an owner and a handoff rule'],
    ['Experiments, with no operating rules', 'In use, but the output is inconsistent', "Workflows run, but they're fragmented", 'In use, with rules and a person accountable'],
    ['Whoever speaks loudest', "Whoever's available", 'By loose guidelines', 'By a written rule'],
    ['Almost all of it', 'Most of it', 'Some of it', 'Very little. The system carries most of it'],
    ['Frequently', 'Often', 'Sometimes', 'Rarely. Quotes, checklists, and job history are reusable'],
    ['The work stops', 'It slows sharply', 'The team copes, painfully', 'The work continues'],
    ['Not visible', 'Partly visible', 'Mostly visible', 'Visible as they change'],
    ["It doesn't", 'Informally, in conversation', 'We review sometimes', 'We review results and change how the next job runs'],
    ['Chaos', 'Reactive', 'Building', 'Compounding'],
  ],
  pressure: {
    start: 'Jobs stall before the work starts',
    handoff: 'Momentum drops between the office, the field, or the customer',
    next: 'The next job or task is figured out in the moment',
    priorities: 'Priorities exist, but only informally',
    memory: 'Quotes, approvals, or job notes live in people',
    scattered: 'The job record is loosely organized',
    tools: "AI tools aren't in quotes, scheduling, or follow-up yet",
    learning: 'What a job taught the crew leaves with the job',
    followup: 'Missed calls, quote requests, or questions wait on memory',
    'loose-followup': 'Follow-up has a loose process',
    ownership: 'Ownership is unclear when a job has to move',
    'informal-owner': "Ownership depends on who's free",
    ai: 'AI is in the work without operating rules',
    decisions: 'Schedule and customer decisions have no written rule',
    revenue: 'Revenue still depends on someone remembering to follow up',
    'some-manual': 'Some revenue still depends on manual follow-up',
    repeat: 'Quotes, forms, or jobs get redone from scratch',
    'sometimes-repeat': 'Redoing past work still shows up',
    'key-person': 'The owner or lead tech out stops or sharply slows the work',
    pipeline: "Booked jobs, open quotes, and approvals can't be seen",
    'partial-pipe': 'The schedule is only partly visible',
    loop: "Finished jobs don't change how the next one runs",
    shape: 'The business is described as chaos or reaction',
  },
  archetype: {
    bottleneckOperator: 'A person is still the routing system',
    toolOverload: 'Tools or handoffs are the first place to check',
    executionStall: 'Starting, the next job, or the learning loop stalls',
    fragmentedWorkflow: 'The answers point to scattered job coordination',
  },
  profile: {
    FRAGMENTED: 'Answers suggest jobs are held together by people, not by a shared record.',
    STALLED: 'Answers suggest gaps between the quote, the job, the approval, and getting paid.',
    SCALING: 'Answers suggest redone work and double-checking that can come down.',
    COMPOUNDING: 'Answers suggest new tools can stay tied to a business that is already connected.',
  },
  department: {
    ACC: 'Customer follow-up',
    FIN: 'Invoicing',
    LGL: 'Compliance',
    PRD: 'Field work',
    STR: 'Planning',
    CRT: 'Marketing',
    PR: 'Reviews and reputation',
    MED: 'Scheduling and dispatch',
    HR: 'Crew',
    OPS: 'Operations',
  },
};

export const AUDIENCES: Record<AudienceId, Audience> = {
  agency: AGENCY,
  consulting: CONSULTING,
  service: SERVICE,
};

export const AUDIENCE_ORDER: readonly AudienceId[] = ['agency', 'consulting', 'service'];

export function isAudienceId(value: unknown): value is AudienceId {
  return value === 'agency' || value === 'consulting' || value === 'service';
}

export const PROFILE_WORD: Record<ProfileId, string> = {
  FRAGMENTED: 'Fragmented',
  STALLED: 'Stalled',
  SCALING: 'Scaling',
  COMPOUNDING: 'Compounding',
};
