export type AnswerValue = 0 | 1 | 2;

export type SurveyOption = {
  id: string;
  text: string;
  value: AnswerValue;
};

export type SurveyQuestion = {
  id: number;
  text: string;
  options: readonly SurveyOption[];
};

export type SurveySelection = {
  questionId: number;
  optionId: string;
  value: AnswerValue;
};

export type Profile = "FRAGMENTED" | "STALLED" | "SCALING" | "COMPOUNDING";
export type Archetype =
  | "bottleneckOperator"
  | "toolOverload"
  | "executionStall"
  | "fragmentedWorkflow";

export type Pressure = {
  id: string;
  title: string;
  implication: string;
};

export type SurveyReport = {
  evidenceStatus: "SURVEY-DERIVED";
  rawScore: number;
  maxScore: 30;
  scoreIndex: number;
  band: "0-24" | "25-49" | "50-74" | "75-100";
  profile: Profile;
  description: string;
  pressures: Pressure[];
  archetype: Archetype;
};

const option = (questionId: number, position: number, text: string, value: AnswerValue): SurveyOption => ({
  id: `q${questionId}-o${position}`,
  text,
  value,
});

export const QUESTIONS: readonly SurveyQuestion[] = [
  {
    id: 1,
    text: "Where does your business lose momentum most often?",
    options: [
      option(1, 1, "Starting things", 0),
      option(1, 2, "Switching between tools", 1),
      option(1, 3, "Waiting on others", 1),
      option(1, 4, "Finishing", 2),
    ],
  },
  {
    id: 2,
    text: "How does your team know what to work on next?",
    options: [
      option(2, 1, "We figure it out as we go", 0),
      option(2, 2, "We have informal priorities", 1),
      option(2, 3, "We've got a system, but it isn't always followed", 1),
      option(2, 4, "We have a clear routing process", 2),
    ],
  },
  {
    id: 3,
    text: "Where does your team keep the knowledge it needs?",
    options: [
      option(3, 1, "In people's heads", 0),
      option(3, 2, "In scattered docs and chats", 0),
      option(3, 3, "In a loosely organized system", 1),
      option(3, 4, "In a structured, accessible system", 2),
    ],
  },
  {
    id: 4,
    text: "How many AI agents and tools do you use?",
    options: [
      option(4, 1, "None yet", 0),
      option(4, 2, "One or two, lightly", 1),
      option(4, 3, "Several, but they aren't connected", 1),
      option(4, 4, "Several, connected and producing consistent output", 2),
    ],
  },
  {
    id: 5,
    text: "When a project ends, what happens to what was learned?",
    options: [
      option(5, 1, "It disappears with the project", 0),
      option(5, 2, "Some notes get saved somewhere", 1),
      option(5, 3, "We debrief but nothing formal", 1),
      option(5, 4, "We capture it and it improves future work", 2),
    ],
  },
  {
    id: 6,
    text: "How does your business handle missed leads or unanswered inquiries?",
    options: [
      option(6, 1, "They usually fall through the cracks", 0),
      option(6, 2, "We follow up manually when we remember", 0),
      option(6, 3, "We have a loose process", 1),
      option(6, 4, "We have automated follow-up", 2),
    ],
  },
  {
    id: 7,
    text: "How clear is ownership when something needs to get done?",
    options: [
      option(7, 1, "Unclear - it often falls through", 0),
      option(7, 2, "It depends on who is available", 1),
      option(7, 3, "We have informal ownership", 1),
      option(7, 4, "Every task has a clear owner and routing rule", 2),
    ],
  },
  {
    id: 8,
    text: "How do AI agents and tools fit into your work?",
    options: [
      option(8, 1, "Experimenting with no system", 0),
      option(8, 2, "Using tools but results are inconsistent", 1),
      option(8, 3, "Running workflows but they are fragmented", 1),
      option(8, 4, "Using AI agents and tools with clear rules and oversight", 2),
    ],
  },
  {
    id: 9,
    text: "How does your business make decisions under pressure?",
    options: [
      option(9, 1, "Whoever speaks loudest", 0),
      option(9, 2, "By whoever is available", 0),
      option(9, 3, "Using loose guidelines", 1),
      option(9, 4, "Using documented decision rules", 2),
    ],
  },
  {
    id: 10,
    text: "How much of your revenue depends on manual follow-up or human memory?",
    options: [
      option(10, 1, "Almost all of it", 0),
      option(10, 2, "Most of it", 0),
      option(10, 3, "Some of it", 1),
      option(10, 4, "Very little - systems handle most of it", 2),
    ],
  },
  {
    id: 11,
    text: "How often does your team repeat work that has already been done?",
    options: [
      option(11, 1, "Frequently", 0),
      option(11, 2, "Often", 0),
      option(11, 3, "Sometimes", 1),
      option(11, 4, "Rarely - we have reusable systems", 2),
    ],
  },
  {
    id: 12,
    text: "What happens when a key person is unavailable?",
    options: [
      option(12, 1, "Work stops", 0),
      option(12, 2, "Things slow down significantly", 0),
      option(12, 3, "We manage, but it's painful", 1),
      option(12, 4, "The system continues without disruption", 2),
    ],
  },
  {
    id: 13,
    text: "How visible is your pipeline or lead flow at any given moment?",
    options: [
      option(13, 1, "Not visible at all", 0),
      option(13, 2, "Partially visible", 1),
      option(13, 3, "Mostly visible", 1),
      option(13, 4, "Fully visible with real-time tracking", 2),
    ],
  },
  {
    id: 14,
    text: "How does your business improve from what it executes?",
    options: [
      option(14, 1, "It doesn't", 0),
      option(14, 2, "Informally, through conversation", 1),
      option(14, 3, "We review occasionally", 1),
      option(14, 4, "We review results and update how we work", 2),
    ],
  },
  {
    id: 15,
    text: "Which word best describes how work runs today?",
    options: [
      option(15, 1, "Chaos", 0),
      option(15, 2, "Reactive", 0),
      option(15, 3, "Building", 1),
      option(15, 4, "Compounding", 2),
    ],
  },
] as const;

const pressure = (id: string, title: string, implication: string): Pressure => ({ id, title, implication });

const PRESSURE_WHEN_ZERO: Record<number, Pressure> = {
  1: pressure("start", "Work struggles to get moving", "The first step is unclear, so energy is spent beginning instead of progressing."),
  2: pressure("next", "Priorities are rebuilt in the moment", "People decide what comes next as they go, which makes attention easy to pull off course."),
  3: pressure("memory", "Information is scattered", "People have to search messages or ask around before they can move with confidence."),
  4: pressure("tools", "The work needs a path before another tool", "A new tool can add output. It can't decide where that output belongs or who finishes it."),
  5: pressure("learning", "Lessons disappear when the work ends", "The next project pays again for knowledge the business already earned."),
  6: pressure("followup", "Follow-up depends on memory", "A lead or promise can disappear when the person remembering it gets pulled elsewhere."),
  7: pressure("ownership", "Work can wait without an owner", "People spend time finding someone to act while the task loses momentum."),
  8: pressure("ai", "AI output arrives without a clear next step", "People have to judge, route, and recover the output by hand before it becomes useful."),
  9: pressure("decisions", "Pressure changes who gets heard", "Decisions depend on presence or volume instead of the facts the work requires."),
  10: pressure("revenue", "Revenue depends on remembering", "Income stays exposed to the availability and memory of the people holding the follow-up."),
  11: pressure("repeat", "Good work is being paid for twice", "People repeat work because the useful answer didn't stay findable or reusable."),
  12: pressure("key-person", "One absence can stop the work", "The business loses momentum when the person carrying the missing context is unavailable."),
  13: pressure("pipeline", "Leads can disappear from view", "People can't act with confidence because the current status is hard to see."),
  14: pressure("loop", "The business keeps relearning the same lesson", "Completed work doesn't improve the next attempt, so avoidable problems return."),
  15: pressure("shape", "Incoming work controls the day", "People react to what arrives instead of protecting time for what matters most."),
};

const PRESSURE_WHEN_ONE: Record<number, Pressure> = {
  1: pressure("handoff", "Momentum fades between tools and people", "Waiting and switching interrupt the work before it reaches done."),
  2: pressure("priorities", "Priorities live in conversation", "The next move can change depending on who is present to explain it."),
  3: pressure("scattered", "The current answer takes work to find", "People can usually locate it, but the search steals focus from the task itself."),
  6: pressure("loose-followup", "Follow-up is easy to lose", "The next contact exists, but it isn't protected from distraction or absence."),
  7: pressure("informal-owner", "Ownership depends on who is free", "The most available person carries the work, whether or not they should."),
  10: pressure("some-manual", "Some revenue still depends on memory", "A busy week or missed reminder can still cost the business an earned opportunity."),
  11: pressure("sometimes-repeat", "Some work has to be done again", "Useful effort is lost when the answer can't travel into the next task."),
  13: pressure("partial-pipe", "Part of the pipeline is hidden", "A lead can sit still because the person who could move it can't see its status."),
};

const PROFILE_COPY: Record<Profile, string> = {
  FRAGMENTED: "People are keeping work alive by hunting for information, remembering follow-up, and reconnecting decisions that should travel with the work.",
  STALLED: "The business has a process, but people still bridge its weak points. When they are unavailable, momentum slows or stops.",
  SCALING: "The business is moving, but repeated repair is taking time from better work. Growth will multiply that burden unless the gaps close.",
  COMPOUNDING: "Work is moving with fewer manual repairs. The priority is protecting that confidence as AI creates more work, faster.",
};

export function deriveArchetype(pressures: readonly Pressure[]): Archetype {
  const ids = new Set(pressures.map((item) => item.id));
  if (["key-person", "ownership", "informal-owner"].some((id) => ids.has(id))) return "bottleneckOperator";
  if (["tools", "handoff"].some((id) => ids.has(id))) return "toolOverload";
  if (["start", "loop", "next"].some((id) => ids.has(id))) return "executionStall";
  return "fragmentedWorkflow";
}

export function deriveSurveyReport(selections: readonly SurveySelection[]): SurveyReport | null {
  if (selections.length !== QUESTIONS.length) return null;

  const byQuestion = new Map(selections.map((selection) => [selection.questionId, selection]));
  const values = QUESTIONS.map((question) => {
    const selection = byQuestion.get(question.id);
    const matchedOption = selection && question.options.find((candidate) => candidate.id === selection.optionId);
    if (!selection || !matchedOption || matchedOption.value !== selection.value) {
      throw new Error(`Invalid selection for question ${question.id}.`);
    }
    return selection.value;
  });

  const rawScore = values.reduce<number>((sum, value) => sum + value, 0);
  const scoreIndex = Math.round((rawScore / 30) * 100);
  const zeros = values.flatMap((value, index) => (value === 0 && PRESSURE_WHEN_ZERO[index + 1] ? [PRESSURE_WHEN_ZERO[index + 1]] : []));
  const ones = values.flatMap((value, index) => (value === 1 && PRESSURE_WHEN_ONE[index + 1] ? [PRESSURE_WHEN_ONE[index + 1]] : []));
  const pressures = [...zeros, ...ones].slice(0, 4);

  let band: SurveyReport["band"];
  let profile: Profile;
  if (rawScore <= 7) {
    band = "0-24";
    profile = "FRAGMENTED";
  } else if (rawScore <= 14) {
    band = "25-49";
    profile = "STALLED";
  } else if (rawScore <= 22) {
    band = "50-74";
    profile = "SCALING";
  } else {
    band = "75-100";
    profile = "COMPOUNDING";
  }

  return {
    evidenceStatus: "SURVEY-DERIVED",
    rawScore,
    maxScore: 30,
    scoreIndex,
    band,
    profile,
    description: PROFILE_COPY[profile],
    pressures,
    archetype: deriveArchetype(pressures),
  };
}

export function selectedValues(selections: readonly SurveySelection[]): AnswerValue[] {
  const report = deriveSurveyReport(selections);
  if (!report) throw new Error("All 15 questions must be answered before scenario calculation.");
  const byQuestion = new Map(selections.map((selection) => [selection.questionId, selection.value]));
  return QUESTIONS.map((question) => byQuestion.get(question.id) as AnswerValue);
}

export function presetHours(profile: Profile): readonly [number, number] {
  const hours: Record<Profile, readonly [number, number]> = {
    FRAGMENTED: [6, 12],
    STALLED: [4, 8],
    SCALING: [2, 5],
    COMPOUNDING: [1, 3],
  };
  return hours[profile];
}
