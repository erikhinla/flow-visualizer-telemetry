import type { Department } from "./departments";
import { PATHWAY } from "./pathway";
import { buildReadout, type Readout } from "./readout";
import type { ScenarioResult } from "./scenario";
import type { SurveyReport } from "./survey";

export type FlowBlueprint = {
  title: "FLOW Fog Report";
  generatedAt: string;
  department: Pick<Department, "code" | "name" | "moniker">;
  reportedGap: { evidenceStatus: "ASSUMED"; text: string };
  humanRepair: { evidenceStatus: "ASSUMED"; text: string };
  connectionToTest: { evidenceStatus: "PROPOSED"; text: string };
  fogTakes: string;
  payoff: string;
  survey: Pick<SurveyReport, "evidenceStatus" | "rawScore" | "maxScore" | "scoreIndex" | "profile" | "pressures" | "archetype">;
  scenario: ScenarioResult;
  readout: Readout;
  pathway: typeof PATHWAY;
  nextAction: string;
  evidenceNeeded: string;
};

export function buildFlowBlueprint(
  survey: SurveyReport,
  department: Department,
  scenario: ScenarioResult,
  now: Date = new Date(),
): FlowBlueprint {
  return {
    title: "FLOW Fog Report",
    generatedAt: now.toISOString(),
    department: { code: department.code, name: department.name, moniker: department.moniker },
    reportedGap: { evidenceStatus: "ASSUMED", text: department.gap },
    humanRepair: { evidenceStatus: "ASSUMED", text: department.repair },
    connectionToTest: { evidenceStatus: "PROPOSED", text: department.connection },
    fogTakes: department.fogTakes,
    payoff: department.payoff,
    survey: {
      evidenceStatus: survey.evidenceStatus,
      rawScore: survey.rawScore,
      maxScore: survey.maxScore,
      scoreIndex: survey.scoreIndex,
      profile: survey.profile,
      pressures: survey.pressures,
      archetype: survey.archetype,
    },
    scenario,
    readout: buildReadout(survey, department, scenario),
    pathway: PATHWAY,
    nextAction: `Start with the recurring task where this burden shows up most. Trace it from request to finished work and mark every moment someone has to search, chase, remember, or rebuild what is missing.`,
    evidenceNeeded: `Watch ${department.compare.toLowerCase()} in the same kind of work before and after the change. That shows whether time and confidence actually return.`,
  };
}
