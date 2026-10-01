import { DEPARTMENTS, type DepartmentKey } from "./departments";
import type { AnswerValue } from "./survey";

export type ScenarioResult = {
  evidenceStatus: "ILLUSTRATIVE";
  modelVersion: "friction-fog-revision-3";
  department: DepartmentKey;
  flowActive: boolean;
  inputs: {
    answerScoreIndex: number;
    answer4Value: AnswerValue;
    answer8Value: AnswerValue;
    upstreamWeight: number;
    dependencyWeight: number;
  };
  variables: {
    outputVolumeProxy: number;
    fragilityProxy: number;
    effectiveFragilityProxy: number;
    dependencyFactor: number;
    frictionIndex: number;
  };
  modelLossIndex: number;
  monsterHeightFeet: number;
};

export function evaluateScenarioRevision3(
  answers: readonly AnswerValue[],
  department: DepartmentKey,
  flowActive: boolean,
): ScenarioResult {
  if (answers.length !== 15) throw new Error("Revision 3 requires exactly 15 answer values.");
  const rawScore = answers.reduce<number>((sum, value) => sum + value, 0);
  const answerScoreIndex = Math.round((100 * rawScore) / 30);
  const answer4Value = answers[3] ?? 0;
  const answer8Value = answers[7] ?? 0;
  const outputVolumeProxy = 0.2 + 0.15 * (answer4Value + answer8Value);
  const fragilityProxy = answerScoreIndex === 100 ? 0 : 1 - answerScoreIndex / 100;
  const effectiveFragilityProxy = flowActive ? 0.25 * fragilityProxy : fragilityProxy;
  const selectedDepartment = DEPARTMENTS[department];
  const dependencyFactor = Math.sqrt(selectedDepartment.upstreamWeight * selectedDepartment.dependencyWeight);
  const frictionIndex = outputVolumeProxy * effectiveFragilityProxy * (1 - answerScoreIndex / 200);
  const compounded = Math.pow(Math.max(0, frictionIndex * dependencyFactor), 1.8);
  const modelLossIndex = effectiveFragilityProxy === 0 ? 0 : Math.min(100, (100 / 1.5) * compounded);
  const monsterHeightFeet = 30 * (modelLossIndex / 100);

  return {
    evidenceStatus: "ILLUSTRATIVE",
    modelVersion: "friction-fog-revision-3",
    department,
    flowActive,
    inputs: {
      answerScoreIndex,
      answer4Value,
      answer8Value,
      upstreamWeight: selectedDepartment.upstreamWeight,
      dependencyWeight: selectedDepartment.dependencyWeight,
    },
    variables: {
      outputVolumeProxy,
      fragilityProxy,
      effectiveFragilityProxy,
      dependencyFactor,
      frictionIndex,
    },
    modelLossIndex,
    monsterHeightFeet,
  };
}
