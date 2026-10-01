// Added by Claude in error. Safe to delete:
//   rm src/lib/readout-attribution.test.ts
// Contains only reproductions of the VISUALIZER_MASTER section 6 fixtures and
// touches no source file.
import { describe, expect, it } from "vitest";
import { evaluateScenarioRevision3 } from "./scenario";
import { QUESTIONS, type AnswerValue } from "./survey";

const answers = (valueFor: (questionId: number) => AnswerValue): AnswerValue[] =>
  QUESTIONS.map((question) => valueFor(question.id));

describe("VISUALIZER_MASTER arithmetic fixtures", () => {
  it("M = 6.2446 for all-zero answers, Account Management, modifier off", () => {
    expect(evaluateScenarioRevision3(answers(() => 0), "AM", false).modelLossIndex).toBeCloseTo(6.2446, 4);
  });

  it("M = 15.7525 when only Q4 becomes 1", () => {
    expect(evaluateScenarioRevision3(answers((id) => (id === 4 ? 1 : 0)), "AM", false).modelLossIndex).toBeCloseTo(15.7525, 4);
  });

  it("no modeled fog when every answer is 2", () => {
    const scenario = evaluateScenarioRevision3(answers(() => 2), "OPS", false);
    expect(scenario.modelLossIndex).toBe(0);
    expect(scenario.monsterHeightFeet).toBe(0);
  });
});
