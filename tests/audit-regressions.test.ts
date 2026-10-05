import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QUESTIONS, emptyAnswers, scoreMap } from '../src/lib/questionnaire';
import { buildRecord } from '../src/lib/record';
import { getDepartment } from '../src/lib/departments';
import { compareScenario } from '../src/lib/operational';
import { formatWait } from '../src/lib/format';
import { createDefaultSession, withDepartment } from '../src/lib/session';

function selected(indices: number[]) {
  const answers = emptyAnswers();
  QUESTIONS.forEach((question, index) => {
    const choice = question.choices[indices[index]];
    answers.values[index] = choice.value;
    answers.optionIds[index] = choice.id;
  });
  return answers;
}
function record(inputs = getDepartment('ACC').sample, answers = emptyAnswers()) {
  return buildRecord({ answers, inputs, teamSize: 1, departmentId: 'ACC', evidenceKind: 'simulated', attested: false, modifierOn: false, reviewedOn: '2026-10-05' });
}

describe('PR #4 audit regressions', () => {
  it('exports pressures beyond four without changing saved routing', () => {
    const answers = selected([0, 0, 0, 3, 0, 3, 0, 3, 3, 3, 3, 3, 3, 3, 3]);
    const score = scoreMap(answers)!;
    assert.deepEqual(score.pressures, ['start', 'next', 'memory', 'learning']);
    assert.deepEqual(score.allPressures, ['start', 'next', 'memory', 'learning', 'ownership']);
    assert.equal(score.archetype, 'executionStall');
    assert.deepEqual(record(undefined, answers).map!.pressures.map(p => p.id), score.allPressures);
  });
  it('preserves every option identity and the saved isolated-answer routing', () => {
    const expected = [
      ['executionStall', 'toolOverload', 'toolOverload', 'fragmentedWorkflow'],
      ['executionStall', 'fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow'],
      ['fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow'],
      ['toolOverload', 'fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow'],
      ['fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow'],
      ['fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow'],
      ['bottleneckOperator', 'bottleneckOperator', 'bottleneckOperator', 'fragmentedWorkflow'],
      ['fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow'],
      ['fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow'],
      ['fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow'],
      ['fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow'],
      ['bottleneckOperator', 'bottleneckOperator', 'fragmentedWorkflow', 'fragmentedWorkflow'],
      ['fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow'],
      ['executionStall', 'fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow'],
      ['fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow', 'fragmentedWorkflow'],
    ];
    QUESTIONS.forEach((question, q) => question.choices.forEach((choice, c) => {
      const indices = Array(15).fill(3); indices[q] = c;
      const answers = selected(indices); const score = scoreMap(answers)!;
      assert.equal(answers.optionIds[q], `q${q + 1}-c${c + 1}`);
      assert.equal(score.raw, 28 + choice.value);
      assert.equal(score.archetype, expected[q][c]);
      assert.deepEqual(score.allPressures, choice.pressure ? [choice.pressure] : []);
      assert.equal(record(undefined, answers).map!.answerIndex, score.index);
    }));
  });
  it('keeps unknown and unavailable foundations incomplete in exported records', () => {
    for (const inputs of [{ ...getDepartment('ACC').sample, availableHours: 0 }, { ...getDepartment('ACC').sample, itemCount: null }]) {
      const result = record(inputs);
      assert.equal(result.foundation.state, 'untraced');
      assert.equal(result.foundation.complete, false);
      assert.equal(formatWait(result.scenario.baseline.waitHours), 'Unknown');
    }
    assert.equal(record().foundation.complete, true);
    assert.equal(record().scenario.baseline.queueState, 'no-steady-state');
  });
  it('uses the same accounting for account sample, edits, and the portable yes/no balance', () => {
    const session = withDepartment(createDefaultSession(), 'ACC');
    for (const inputs of [session.inputs, { ...session.inputs, ongoingHours: 20 }, { ...session.inputs, ongoingHours: null }]) {
      const expected = compareScenario(inputs); const exported = record(inputs);
      assert.deepEqual(exported.scenario.baseline, expected.baseline);
      assert.deepEqual(exported.scenario.changed, expected.changed);
      assert.equal(exported.scenario.netReleasedHours, expected.netReleasedHours);
    }
    assert.equal(record().scenario.netReleasedHours, 6);
    assert.equal(record({ ...session.inputs, ongoingHours: 20 }).scenario.netReleasedHours, -12);
  });
});
