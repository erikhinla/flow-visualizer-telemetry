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
  /** One recognisable moment of Digital Friction, in the words this audience uses. */
  moment: string;
  /** Intro headline: the question line, in the words this audience uses. */
  headQuestion: string;
  /** Intro subhead: the stall, then what PROOF shows. */
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
    'The client asks where the approval stands. Someone rebuilds the answer from chat threads, email and memory.',
  headQuestion: '',
  lede: ['AI makes more work, faster. Getting it from brief to launch still runs on people chasing people.', "Answer 15 questions about how work moves at your agency. See where it gets stuck and what it's costing you."],
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
  headQuestion: '',
  lede: ["AI tools increase output, but context doesn't keep up, so humans fill the gap. Context still gets carried by hand, from engagement kickoff to final deliverable.", '15 answers map the route and show where the work stalls. So no one has to spend hours coordinating context.'],
  questions: [
    'Where does client work slow down most often?',
    'How does the team know the next deliverable?',
    'Where are scope, sign-offs, and feedback kept?',
    'How many AI tools does the team use to do and report on client work?',
    'When an engagement ends, what happens to what the team learned?',
    'What happens when a lead or client request gets missed?',
    'How clear is ownership when a deliverable has to move?',
    'How is AI used in client work today?',
    'How are decisions made when a client deadline is pressing?',
    'How much of the work still depends on someone remembering to follow up?',
    'How often does the team rebuild work that already exists?',
    'What happens when the partner who holds the client is out?',
    'How easy is it to see where every engagement stands right now?',
    'How does the firm get better at the work it delivers?',
    'Which word best describes the practice today?',
  ],
  choices: [
    ['Getting the engagement started', 'When it changes hands, or waiting on the client', 'Finishing and delivering it', 'It rarely slows down'],
    ['We figure it out as we go', 'We have informal priorities', "We have a system, but it isn't always followed", 'Every engagement has a clear next step'],
    ['Only in memory', 'In scattered docs, decks, and email threads', 'In a loose folder or project', 'In one record the next consultant can open'],
    ['None yet', 'One or two, lightly', "Several, and they aren't connected", 'Several, connected, with consistent output'],
    ['It leaves with the engagement', 'Some notes are saved somewhere', 'We debrief, but nothing is formal', 'We capture it, and the next engagement starts smarter'],
    ['It usually falls through', 'Someone follows up when they remember', 'We have a loose process', 'Follow-up runs without relying on memory'],
    ['Unclear. It often falls through', "It depends on who's available", 'Ownership is informal', 'Every deliverable has an owner and a clear next step'],
    ['We’re trying things, with no rules', 'In use, but the output is inconsistent', 'It runs some jobs, but each is set up differently', 'In use, with rules and one person in charge of it'],
    ['Whoever speaks loudest', "Whoever's available", 'By loose guidelines', 'By rules we wrote down'],
    ['Almost all of it', 'Most of it', 'Some of it', 'Very little. Reminders handle most of it'],
    ['Every week', 'Most months', 'Sometimes', 'Rarely. Past work and templates are reusable'],
    ['The work stops', 'It slows sharply', 'The team copes, painfully', 'The work continues'],
    ['Not visible', 'Partly visible', 'Mostly visible', 'Visible as they change'],
    ["It doesn't", 'Informally, in conversation', 'We review sometimes', 'We review results and change how the next engagement runs'],
    ['Chaotic', 'Reactive', 'Steady', 'Improving each month'],
  ],
  pressure: {
    start: 'Engagements sit before anyone starts them',
    handoff: 'Work stops when it moves between consultants, tools or the client',
    next: "Nobody's sure what the next deliverable is until someone asks",
    priorities: "Priorities live in people's heads",
    memory: "Scope, sign-offs and client feedback live in people's heads and inboxes",
    scattered: 'Engagement files are spread across drives, inboxes and chat',
    tools: "The team isn't using AI tools on client work yet",
    learning: 'What an engagement taught you leaves when it ends',
    followup: 'Leads, proposal requests and client asks slip unless someone remembers',
    'loose-followup': 'Follow-up happens when someone remembers',
    ownership: "Nobody's sure who has a deliverable when it changes hands",
    'informal-owner': "Who owns it depends on who's around",
    ai: 'AI is in client work, with no rules for using it',
    decisions: 'Deadline calls get made on the fly',
    revenue: 'Too much depends on someone remembering to follow up',
    'some-manual': 'Some follow-up still runs on memory',
    repeat: 'Decks, models and analysis get rebuilt from scratch',
    'sometimes-repeat': 'Work still gets rebuilt sometimes',
    'key-person': 'When the partner who holds the client is out, the work stops',
    pipeline: "You can't see where engagements, proposals and sign-offs stand",
    'partial-pipe': 'You can only partly see where engagements stand',
    loop: "A finished engagement doesn't change how the next one runs",
    shape: 'Most days are spent reacting',
  },
  archetype: {
    bottleneckOperator: 'One person still routes all the work',
    toolOverload: 'Tools or handoffs are the first place to check',
    executionStall: 'Starting, the next deliverable, or the learning loop stalls',
    fragmentedWorkflow: 'The answers point to scattered engagement coordination',
  },
  profile: {
    FRAGMENTED: "Scope, sign-offs and client feedback live in people's heads and inboxes. When someone's out, the engagement waits.",
    STALLED: 'Each consultant does their part, then the work waits: on review, on sign-off, on the client. Deadlines slip in the gaps.',
    SCALING: 'Engagements deliver, but decks and analysis get rebuilt and re-checked on the way.',
    COMPOUNDING: 'Scope, files and sign-offs are in one place, so the next engagement starts from the last one.',
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
  headQuestion: '',
  lede: ["AI tools increase output, but context doesn't keep up, so humans fill the gap. Context still gets carried by hand, from first call to finished job.", '15 answers map the route and show where the work stalls. So no one has to spend hours coordinating context.'],
  questions: [
    'Where does a customer job slow down most often?',
    'How does the crew know the next job or task?',
    'Where are quotes, approvals, and job notes kept?',
    'How many AI tools does the business use to quote, schedule, and follow up on jobs?',
    'When a job wraps, what happens to what the crew learned?',
    'What happens when a customer call or request gets missed?',
    'How clear is ownership when a job has to move to the next step?',
    'How is AI used in the day-to-day work?',
    'How are decisions made when time is short?',
    'How much of the work still depends on someone remembering to follow up?',
    'How often does the team redo work that already exists?',
    'What happens when the owner or lead tech is out?',
    'How easy is it to see where every job and quote stands right now?',
    'How does the business get better at the jobs it does?',
    'Which word best describes the business today?',
  ],
  choices: [
    ['Getting the job booked and started', 'When it moves between the office, the field and the customer', 'Closing out the job', 'It rarely slows down'],
    ['We figure it out as we go', 'We have informal priorities', "We have a schedule, but it isn't always followed", 'Every job has a clear next step'],
    ['Only in memory', 'In texts, emails, and paper', 'In a loose folder or app', 'In one job record anyone on the crew can open'],
    ['None yet', 'One or two, lightly', "Several, and they aren't connected", 'Several, connected, with consistent output'],
    ['It leaves with the job', 'Some notes are saved somewhere', "We talk about it, but nothing's written down", 'We capture it, and the next job runs better'],
    ['It usually falls through', 'Someone calls back when they remember', 'We have a loose process', 'Follow-up runs without relying on memory'],
    ['Unclear. It often falls through', "It depends on who's available", 'Ownership is informal', 'Every job has an owner and a handoff rule'],
    ['We’re trying things, with no rules', 'In use, but the output is inconsistent', 'It runs some jobs, but each is set up differently', 'In use, with rules and one person in charge of it'],
    ['Whoever speaks loudest', "Whoever's available", 'By loose guidelines', 'By a written rule'],
    ['Almost all of it', 'Most of it', 'Some of it', 'Very little. Reminders handle most of it'],
    ['Every week', 'Most months', 'Sometimes', 'Rarely. Quotes, checklists, and job history are reusable'],
    ['The work stops', 'It slows sharply', 'The team copes, painfully', 'The work continues'],
    ['Not visible', 'Partly visible', 'Mostly visible', 'Visible as they change'],
    ["It doesn't", 'Informally, in conversation', 'We review sometimes', 'We review results and change how the next job runs'],
    ['Chaotic', 'Reactive', 'Steady', 'Improving each month'],
  ],
  pressure: {
    start: 'Jobs sit before anyone starts them',
    handoff: 'Work stops when it moves between the office, the crew and the customer',
    next: "Nobody's sure what the next job is until someone asks",
    priorities: "Priorities live in people's heads",
    memory: "Quotes, approvals and job notes live in people's heads and phones",
    scattered: 'Job files are spread across phones, inboxes and paper',
    tools: "The business isn't using AI tools yet",
    learning: 'What a job taught the crew leaves when it ends',
    followup: 'Missed calls and quote requests slip unless someone remembers',
    'loose-followup': 'Follow-up happens when someone remembers',
    ownership: "Nobody's sure who has a job when it changes hands",
    'informal-owner': "Who owns it depends on who's around",
    ai: 'AI is in the work, with no rules for using it',
    decisions: 'Schedule and customer calls get made on the fly',
    revenue: 'Too much depends on someone remembering to follow up',
    'some-manual': 'Some follow-up still runs on memory',
    repeat: 'Quotes, forms and jobs get redone from scratch',
    'sometimes-repeat': 'Work still gets redone sometimes',
    'key-person': 'When the owner or lead tech is out, the work stops',
    pipeline: "You can't see booked jobs, open quotes and approvals",
    'partial-pipe': 'You can only partly see the schedule',
    loop: "A finished job doesn't change how the next one runs",
    shape: 'Most days are spent reacting',
  },
  archetype: {
    bottleneckOperator: 'One person still routes all the work',
    toolOverload: 'Tools or handoffs are the first place to check',
    executionStall: 'Starting, the next job, or the learning loop stalls',
    fragmentedWorkflow: 'The answers point to scattered job coordination',
  },
  profile: {
    FRAGMENTED: "Quotes, approvals and job notes live in people's heads and phones. When someone's out, the job waits.",
    STALLED: 'The crew does the work, then it waits: on the quote, on approval, on the invoice. Payment slips in the gaps.',
    SCALING: 'Jobs get done, but quotes and forms get redone and double-checked on the way.',
    COMPOUNDING: 'Quotes, schedules and job notes are in one place, so the next job starts from the last one.',
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
  FRAGMENTED: 'AI Aware',
  STALLED: 'AI-Ready',
  SCALING: 'AI-Integrated',
  COMPOUNDING: 'Agentic',
};
