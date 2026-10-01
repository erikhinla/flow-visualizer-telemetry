import type { Department } from "./departments";
import { PATHWAY } from "./pathway";
import type { ScenarioResult } from "./scenario";
import type { SurveyReport } from "./survey";

export type FlowBlueprint = {
  title: "FLOW Blueprint";
  generatedAt: string;
  department: Pick<Department, "code" | "name" | "moniker">;
  reportedGap: { evidenceStatus: "ASSUMED"; text: string };
  humanRepair: { evidenceStatus: "ASSUMED"; text: string };
  connectionToTest: { evidenceStatus: "PROPOSED"; text: string };
  survey: Pick<SurveyReport, "evidenceStatus" | "rawScore" | "maxScore" | "scoreIndex" | "profile" | "pressures" | "archetype">;
  scenario: ScenarioResult;
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
    title: "FLOW Blueprint",
    generatedAt: now.toISOString(),
    department: { code: department.code, name: department.name, moniker: department.moniker },
    reportedGap: { evidenceStatus: "ASSUMED", text: department.gap },
    humanRepair: { evidenceStatus: "ASSUMED", text: department.repair },
    connectionToTest: { evidenceStatus: "PROPOSED", text: department.connection },
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
    pathway: PATHWAY,
    nextAction: `Test this connection: ${department.connection}`,
    evidenceNeeded: `Observe ${department.compare.toLowerCase()} for the same workflow and review period before and after the change.`,
  };
}
