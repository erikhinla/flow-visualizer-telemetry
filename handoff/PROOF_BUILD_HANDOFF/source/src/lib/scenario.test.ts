import { describe, expect, it } from "vitest";
import { evaluateScenarioRevision3 } from "./scenario";
import type { AnswerValue } from "./survey";

describe("friction-fog revision 3 illustrative scenario", () => {
  it("returns exact zero for perfect answers with FLOW off or on", () => {
    const answers = Array<AnswerValue>(15).fill(2);
    expect(evaluateScenarioRevision3(answers, "AM", false)).toMatchObject({ modelLossIndex: 0, monsterHeightFeet: 0 });
    expect(evaluateScenarioRevision3(answers, "AM", true)).toMatchObject({ modelLossIndex: 0, monsterHeightFeet: 0 });
  });

  it("preserves the revision 3 zero-answer account-management fixture", () => {
    const result = evaluateScenarioRevision3(Array<AnswerValue>(15).fill(0), "AM", false);
    expect(result.evidenceStatus).toBe("ILLUSTRATIVE");
    expect(result.modelVersion).toBe("friction-fog-revision-3");
    expect(result.modelLossIndex).toBeCloseTo(6.244648356, 8);
    expect(result.monsterHeightFeet).toBeCloseTo(1.8733945068, 8);
  });

  it("records the known Q4 increasing-loss behavior without calling it an improvement", () => {
    const answers = Array<AnswerValue>(15).fill(0);
    answers[3] = 1;
    expect(evaluateScenarioRevision3(answers, "AM", false).modelLossIndex).toBeCloseTo(15.752548011, 8);
  });

  it("applies the FLOW factor before the 1.8 exponent", () => {
    const answers = Array<AnswerValue>(15).fill(0);
    const withoutFlow = evaluateScenarioRevision3(answers, "AM", false);
    const withFlow = evaluateScenarioRevision3(answers, "AM", true);
    expect(withFlow.modelLossIndex / withoutFlow.modelLossIndex).toBeCloseTo(Math.pow(0.25, 1.8), 10);
  });

  it("requires exactly 15 values", () => {
    expect(() => evaluateScenarioRevision3([0, 1, 2], "AM", false)).toThrow("exactly 15");
  });
});
