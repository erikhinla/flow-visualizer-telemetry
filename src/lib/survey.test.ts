import { describe, expect, it } from "vitest";
import { QUESTIONS, deriveSurveyReport, type AnswerValue, type SurveySelection } from "./survey";

function selectionsFor(values: readonly AnswerValue[]): SurveySelection[] {
  return QUESTIONS.map((question, index) => {
    const value = values[index];
    const selected = question.options.find((option) => option.value === value);
    if (!selected || value === undefined) throw new Error(`No option found for question ${question.id}.`);
    return { questionId: question.id, optionId: selected.id, value };
  });
}

function valuesForScore(rawScore: number): AnswerValue[] {
  let remaining = rawScore;
  return QUESTIONS.map(() => {
    const value = Math.min(2, remaining) as AnswerValue;
    remaining -= value;
    return value;
  });
}

describe("FLOW questionnaire contract", () => {
  it("keeps 15 questions, 60 stable option identities, and the 0 to 2 scale", () => {
    expect(QUESTIONS).toHaveLength(15);
    expect(QUESTIONS.flatMap((question) => question.options)).toHaveLength(60);
    expect(QUESTIONS.flatMap((question) => question.options.map((option) => option.id)))
      .toEqual(QUESTIONS.flatMap((question) => question.options.map((_, index) => `q${question.id}-o${index + 1}`)));
    expect(new Set(QUESTIONS.flatMap((question) => question.options.map((option) => option.value))))
      .toEqual(new Set([0, 1, 2]));
  });

  it.each([
    [0, "0-24", "FRAGMENTED"],
    [7, "0-24", "FRAGMENTED"],
    [8, "25-49", "STALLED"],
    [14, "25-49", "STALLED"],
    [15, "50-74", "SCALING"],
    [22, "50-74", "SCALING"],
    [23, "75-100", "COMPOUNDING"],
    [30, "75-100", "COMPOUNDING"],
  ] as const)("maps raw score %s to band %s and profile %s", (rawScore, band, profile) => {
    const report = deriveSurveyReport(selectionsFor(valuesForScore(rawScore)));
    expect(report).toMatchObject({ rawScore, band, profile, evidenceStatus: "SURVEY-DERIVED" });
  });

  it("returns zero-index risk inputs for a perfect response set", () => {
    const report = deriveSurveyReport(selectionsFor(Array<AnswerValue>(15).fill(2)));
    expect(report).toMatchObject({ rawScore: 30, scoreIndex: 100, pressures: [], profile: "COMPOUNDING" });
  });

  it("does not report a partial questionnaire", () => {
    expect(deriveSurveyReport(selectionsFor(Array<AnswerValue>(15).fill(2)).slice(0, 14))).toBeNull();
  });

  it("rejects a mismatched option identity and value", () => {
    const selections = selectionsFor(Array<AnswerValue>(15).fill(2));
    selections[0] = { ...selections[0], optionId: "q1-o1" };
    expect(() => deriveSurveyReport(selections)).toThrow("Invalid selection for question 1");
  });

  it.each([
    [14, 0, "executionStall"],
    [5, 0, "fragmentedWorkflow"],
    [7, 0, "bottleneckOperator"],
    [1, 1, "toolOverload"],
  ] as const)("preserves archetype precedence for question %s value %s", (questionNumber, value, archetype) => {
    const values = Array<AnswerValue>(15).fill(2);
    values[questionNumber - 1] = value;
    expect(deriveSurveyReport(selectionsFor(values))?.archetype).toBe(archetype);
  });
});
