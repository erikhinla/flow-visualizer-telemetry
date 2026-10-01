import type { Department } from "./departments";
import type { ScenarioResult } from "./scenario";
import { presetHours, type Archetype, type Profile, type SurveyReport } from "./survey";

/**
 * The readout turns a survey report into the six things a person needs to
 * understand without reading a score:
 *
 *   what you're feeling -> what's causing it -> where it's showing up ->
 *   what it's costing -> what matters first -> what happens next
 *
 * It is a presentation layer only. It introduces no new scoring, changes no
 * formula, and never restates a survey score as a measured business result.
 * Every section carries the evidence class of the material it came from.
 */

export type EvidenceClass = "SURVEY-DERIVED" | "ASSUMED" | "PROPOSED" | "ILLUSTRATIVE";

export type ReadoutKey =
  | "feeling"
  | "causing"
  | "showingUp"
  | "costing"
  | "mattersFirst"
  | "happensNext";

export type ReadoutSection = {
  key: ReadoutKey;
  label: string;
  headline: string;
  body: string;
  evidence: EvidenceClass;
};

export type Readout = {
  order: readonly ReadoutKey[];
  sections: ReadoutSection[];
};

export const READOUT_ORDER = [
  "feeling",
  "causing",
  "showingUp",
  "costing",
  "mattersFirst",
  "happensNext",
] as const;

const LABELS: Record<ReadoutKey, string> = {
  feeling: "WHAT YOU'RE FEELING",
  causing: "WHAT'S CAUSING IT",
  showingUp: "WHERE IT'S SHOWING UP",
  costing: "WHAT IT'S COSTING",
  mattersFirst: "WHAT MATTERS FIRST",
  happensNext: "WHAT HAPPENS NEXT",
};

const FEELING: Record<Profile, { headline: string; body: string }> = {
  FRAGMENTED: {
    headline: "Work only moves because someone's holding it together.",
    body: "Finding the current version. Remembering who agreed to what. Chasing the next step. None of it looks like work, but it's where the day goes.",
  },
  STALLED: {
    headline: "You've got a process. People are still what makes it work.",
    body: "Most days it holds. When it doesn't, whoever notices first fills the gap. Progress depends on who's around, not the process.",
  },
  SCALING: {
    headline: "Work's moving. The repair work's growing with it.",
    body: "Delivery looks healthy. Underneath it, people keep checking, finding, and explaining the same things. More work means more repair.",
  },
  COMPOUNDING: {
    headline: "Work's moving without constant rescue. That's worth protecting.",
    body: "Fewer gaps need someone to fill them. The risk now is adding AI output faster than the business can handle it.",
  },
};

const CAUSING: Record<Archetype, string> = {
  bottleneckOperator: "Too much of the business depends on one person.",
  toolOverload: "Every new tool adds more work between the work.",
  executionStall: "Starting is easier than finishing.",
  fragmentedWorkflow: "The information people need doesn't move with the work.",
};

/**
 * The pressure IDs that resolve each archetype, in the precedence order used by
 * deriveArchetype(). The cause section must explain the pressure that actually
 * produced the archetype, not simply the first pressure in question order.
 */
const ARCHETYPE_DRIVERS: Record<Archetype, readonly string[]> = {
  bottleneckOperator: ["key-person", "ownership", "informal-owner"],
  toolOverload: ["tools", "handoff"],
  executionStall: ["start", "loop", "next"],
  fragmentedWorkflow: [],
};

function drivingPressure(survey: SurveyReport) {
  const drivers = ARCHETYPE_DRIVERS[survey.archetype];
  return survey.pressures.find((item) => drivers.includes(item.id)) ?? survey.pressures[0];
}

function sentence(text: string): string {
  return text.trim().replace(/[.\s]+$/, "");
}

const NO_PRESSURE_BODY =
  "Your answers didn't point to one clear pressure. The department view below is a place to look, not a finding.";

export function buildReadout(
  survey: SurveyReport,
  department: Department,
  scenario: ScenarioResult,
): Readout {
  const [lowHours, highHours] = presetHours(survey.profile);
  const leadPressure = drivingPressure(survey);
  const otherPressures = survey.pressures.filter((item) => item.id !== leadPressure?.id);
  const feeling = FEELING[survey.profile];

  const sections: ReadoutSection[] = [
    {
      key: "feeling",
      label: LABELS.feeling,
      headline: feeling.headline,
      body: feeling.body,
      evidence: "SURVEY-DERIVED",
    },
    {
      key: "causing",
      label: LABELS.causing,
      headline: CAUSING[survey.archetype],
      body: leadPressure ? leadPressure.implication : NO_PRESSURE_BODY,
      evidence: "SURVEY-DERIVED",
    },
    {
      key: "showingUp",
      label: LABELS.showingUp,
      headline: `Here's what this looks like in ${department.name}.`,
      body: otherPressures.length > 0
        ? `${department.gap} ${department.repair} Your answers also point to ${otherPressures.map((item) => item.title.toLowerCase()).join("; ")}.`
        : `${department.gap} ${department.repair}`,
      evidence: "ASSUMED",
    },
    {
      key: "costing",
      label: LABELS.costing,
      headline: department.fogTakes,
      body: `The model puts this pattern at about ${lowHours} to ${highHours} hours per person each week. We haven't measured that in your business yet.`,
      evidence: "ILLUSTRATIVE",
    },
    {
      key: "mattersFirst",
      label: LABELS.mattersFirst,
      headline: department.connection,
      body: department.payoff,
      evidence: "PROPOSED",
    },
    {
      key: "happensNext",
      label: LABELS.happensNext,
      headline: "Trace one recurring task from the request to done.",
      body: `Mark every moment someone has to search, chase, remember, or rebuild what is missing. Then watch ${sentence(department.compare).toLowerCase()} in that same kind of work before and after the change. ${
        scenario.flowActive
          ? "The formula now shows what it expects if the gap shrinks. It isn't a result you've achieved yet."
          : "Turn on 'Show the gap reduced' to see the direction the formula expects."
      }`,
      evidence: "PROPOSED",
    },
  ];

  return { order: READOUT_ORDER, sections };
}

export function readoutSection(readout: Readout, key: ReadoutKey): ReadoutSection {
  const found = readout.sections.find((section) => section.key === key);
  if (!found) throw new Error(`Readout is missing the ${key} section.`);
  return found;
}
