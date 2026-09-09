import { describe, expect, it } from "vitest";
import { buildFlowBlueprint } from "./blueprint";
import { DEPARTMENTS } from "./departments";
import { evaluateScenarioRevision3 } from "./scenario";
import { QUESTIONS, deriveSurveyReport, type AnswerValue } from "./survey";

describe("FLOW Blueprint output contract", () => {
  it("keeps assumed, proposed, survey-derived, and illustrative claims separate", () => {
    const answers = Array<AnswerValue>(15).fill(1);
    const selections = QUESTIONS.map((question, index) => {
      const selected = question.options.find((option) => option.value === answers[index]);
      if (!selected) throw new Error("Fixture option missing.");
      return { questionId: question.id, optionId: selected.id, value: answers[index] };
    });
    const report = deriveSurveyReport(selections);
    if (!report) throw new Error("Fixture report missing.");
    const scenario = evaluateScenarioRevision3(answers, "OPS", false);
    const blueprint = buildFlowBlueprint(report, DEPARTMENTS.OPS, scenario, new Date("2026-09-09T12:00:00.000Z"));

    expect(blueprint.generatedAt).toBe("2026-09-09T12:00:00.000Z");
    expect(blueprint.reportedGap.evidenceStatus).toBe("ASSUMED");
    expect(blueprint.humanRepair.evidenceStatus).toBe("ASSUMED");
    expect(blueprint.connectionToTest.evidenceStatus).toBe("PROPOSED");
    expect(blueprint.survey.evidenceStatus).toBe("SURVEY-DERIVED");
    expect(blueprint.scenario.evidenceStatus).toBe("ILLUSTRATIVE");
    expect(blueprint.evidenceNeeded).toContain("before and after the change");
  });
});
