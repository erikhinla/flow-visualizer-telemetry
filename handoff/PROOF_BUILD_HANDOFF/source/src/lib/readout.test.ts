import { describe, expect, it } from "vitest";
import { DEPARTMENTS } from "./departments";
import { READOUT_ORDER, buildReadout, readoutSection } from "./readout";
import { evaluateScenarioRevision3 } from "./scenario";
import { QUESTIONS, deriveSurveyReport, type AnswerValue, type SurveySelection } from "./survey";

function selectionsForValue(value: AnswerValue): SurveySelection[] {
  return QUESTIONS.map((question) => {
    const option = question.options.find((candidate) => candidate.value === value) ?? question.options[0];
    return { questionId: question.id, optionId: option.id, value: option.value };
  });
}

function readoutFor(value: AnswerValue, departmentKey: keyof typeof DEPARTMENTS = "OPS", flowActive = false) {
  const selections = selectionsForValue(value);
  const survey = deriveSurveyReport(selections);
  if (!survey) throw new Error("survey report expected");
  const answers = QUESTIONS.map((question) => {
    const selection = selections.find((item) => item.questionId === question.id);
    if (!selection) throw new Error("selection expected");
    return selection.value;
  });
  const scenario = evaluateScenarioRevision3(answers, departmentKey, flowActive);
  return { survey, scenario, readout: buildReadout(survey, DEPARTMENTS[departmentKey], scenario) };
}

describe("readout", () => {
  it("returns the six sections in the required order", () => {
    const { readout } = readoutFor(0);
    expect(readout.sections.map((section) => section.key)).toEqual([...READOUT_ORDER]);
    expect(readout.sections.map((section) => section.label)).toEqual([
      "WHAT YOU'RE FEELING",
      "WHAT'S CAUSING IT",
      "WHERE IT'S SHOWING UP",
      "WHAT IT'S COSTING",
      "WHAT MATTERS FIRST",
      "WHAT HAPPENS NEXT",
    ]);
  });

  it("leads with a felt statement, not a number", () => {
    const { readout } = readoutFor(0);
    const feeling = readoutSection(readout, "feeling");
    expect(feeling.headline).toMatch(/[a-z]/);
    expect(feeling.headline).not.toMatch(/\d/);
    expect(feeling.body).not.toMatch(/\bscore\b/i);
  });

  it("never presents the survey score as a measured result", () => {
    for (const value of [0, 1, 2] as AnswerValue[]) {
      const { readout } = readoutFor(value);
      for (const section of readout.sections) {
        expect(`${section.headline} ${section.body}`).not.toMatch(/measured (hours|time|cost|loss)/i);
      }
    }
  });

  it("labels the cost section as illustrative and names the modeled range", () => {
    const { readout } = readoutFor(0);
    const costing = readoutSection(readout, "costing");
    expect(costing.evidence).toBe("ILLUSTRATIVE");
    expect(costing.body).toContain("6 to 12 hours per person each week");
    expect(costing.body).toMatch(/haven't measured/i);
  });

  it("carries the evidence class of its source material", () => {
    const { readout } = readoutFor(1);
    expect(readoutSection(readout, "feeling").evidence).toBe("SURVEY-DERIVED");
    expect(readoutSection(readout, "causing").evidence).toBe("SURVEY-DERIVED");
    expect(readoutSection(readout, "showingUp").evidence).toBe("ASSUMED");
    expect(readoutSection(readout, "mattersFirst").evidence).toBe("PROPOSED");
    expect(readoutSection(readout, "happensNext").evidence).toBe("PROPOSED");
  });

  it("says so plainly when no pressure pattern was triggered", () => {
    const { survey, readout } = readoutFor(2);
    expect(survey.pressures).toHaveLength(0);
    expect(readoutSection(readout, "causing").body).toMatch(/didn't point to one clear pressure/i);
  });

  it("explains the pressure that actually produced the archetype", () => {
    const { survey, readout } = readoutFor(0);
    const drivers: Record<string, string[]> = {
      bottleneckOperator: ["key-person", "ownership", "informal-owner"],
      toolOverload: ["tools", "handoff"],
      executionStall: ["start", "loop", "next"],
      fragmentedWorkflow: [],
    };
    const expected = survey.pressures.find((item) => drivers[survey.archetype].includes(item.id)) ?? survey.pressures[0];
    expect(readoutSection(readout, "causing").body).toBe(expected.implication);
  });

  it("does not double-punctuate the measure to watch", () => {
    for (const key of Object.keys(DEPARTMENTS) as (keyof typeof DEPARTMENTS)[]) {
      const { readout } = readoutFor(0, key);
      expect(readoutSection(readout, "happensNext").body).not.toMatch(/\.\s+in that same kind of work/);
      expect(readoutSection(readout, "happensNext").body).not.toMatch(/\.\./);
    }
  });

  it("names the selected department and the first fix", () => {
    const { readout } = readoutFor(0, "FIN");
    expect(readoutSection(readout, "showingUp").headline).toBe("Here's what this looks like in Finance.");
    expect(readoutSection(readout, "mattersFirst").headline).toBe(DEPARTMENTS.FIN.connection);
  });

  it("frames the reduced-gap comparison as a direction, never an achieved result", () => {
    const { readout } = readoutFor(0, "OPS", true);
    expect(readoutSection(readout, "happensNext").body).toMatch(/isn't a result you've achieved yet/i);
  });

  it("keeps every section populated for every profile and department", () => {
    for (const value of [0, 1, 2] as AnswerValue[]) {
      for (const key of Object.keys(DEPARTMENTS) as (keyof typeof DEPARTMENTS)[]) {
        const { readout } = readoutFor(value, key);
        expect(readout.sections).toHaveLength(6);
        for (const section of readout.sections) {
          expect(section.headline.trim().length).toBeGreaterThan(0);
          expect(section.body.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});
