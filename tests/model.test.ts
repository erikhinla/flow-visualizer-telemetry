import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AGENCY_BALANCE } from '../src/lib/agency';
import { DEPARTMENTS, getDepartment } from '../src/lib/departments';
import { formatHours, formatPressure } from '../src/lib/format';
import { manifestation } from '../src/lib/manifestation';
import { compareScenario, evaluateScenario, repairHours } from '../src/lib/operational';
import {
  QUESTIONS,
  archetypeFor,
  clampTeam,
  emptyAnswers,
  isComplete,
  scoreMap,
  suggestDepartment,
  teamHours,
} from '../src/lib/questionnaire';
import type { PressureId } from '../src/lib/types';

function answered(values: Array<0 | 1 | 2>, optionIndex = 0) {
  const answers = emptyAnswers();
  values.forEach((value, index) => {
    const choice =
      QUESTIONS[index].choices.find(
        (item) => item.value === value && item.id.endsWith(`c${optionIndex + 1}`)
      ) ?? QUESTIONS[index].choices.find((item) => item.value === value);
    answers.values[index] = value;
    answers.optionIds[index] = choice?.id ?? null;
  });
  return answers;
}

function all(value: 0 | 1 | 2) {
  return answered(Array.from({ length: 15 }, () => value));
}

describe('momentum map', () => {
  it('keeps sixty choices and rejects an unfinished map', () => {
    assert.equal(QUESTIONS.length, 15);
    assert.equal(
      QUESTIONS.reduce((sum, question) => sum + question.choices.length, 0),
      60
    );
    assert.equal(isComplete(emptyAnswers()), false);
    assert.equal(scoreMap(emptyAnswers()), null);
  });

  it('rounds the answer index and assigns the saved profiles', () => {
    const cases: Array<[number, number, string]> = [
      [0, 0, 'FRAGMENTED'],
      [1, 3, 'FRAGMENTED'],
      [7, 23, 'FRAGMENTED'],
      [8, 27, 'STALLED'],
      [14, 47, 'STALLED'],
      [15, 50, 'SCALING'],
      [22, 73, 'SCALING'],
      [23, 77, 'COMPOUNDING'],
      [30, 100, 'COMPOUNDING'],
    ];
    for (const [raw, index, profile] of cases) {
      const built = Array.from({ length: 15 }, () => 0) as Array<0 | 1 | 2>;
      let remaining = raw;
      for (let position = 0; position < built.length && remaining > 0; position += 1) {
        const step = Math.min(2, remaining) as 0 | 1 | 2;
        built[position] = step;
        remaining -= step;
      }
      const score = scoreMap(answered(built));
      assert.ok(score);
      assert.equal(score.raw, raw);
      assert.equal(score.index, index);
      assert.equal(score.profile, profile);
    }
  });

  it('orders zero-point pressures before one-point pressures and keeps four', () => {
    const values = Array.from({ length: 15 }, () => 2) as Array<0 | 1 | 2>;
    values[0] = 0; // start
    values[1] = 0; // next
    values[2] = 0; // memory
    values[4] = 0; // learning
    values[6] = 0; // ownership, fifth zero, excluded
    values[3] = 1; // tools is a zero pressure, wait Q4 value 1 has no pressure
    const score = scoreMap(answered(values));
    assert.deepEqual(score?.pressures, ['start', 'next', 'memory', 'learning']);
    assert.equal(score?.archetype, 'executionStall');
  });

  it('lets ownership outrank tools when both are in the four', () => {
    const values = Array.from({ length: 15 }, () => 2) as Array<0 | 1 | 2>;
    values[3] = 0; // tools
    values[6] = 1; // informal-owner
    const score = scoreMap(answered(values));
    assert.deepEqual(score?.pressures, ['tools', 'informal-owner']);
    assert.equal(score?.archetype, 'bottleneckOperator');
  });

  it('routes the documented single-answer cases', () => {
    const only = (question: number, value: 0 | 1 | 2, archetype: string) => {
      const values = Array.from({ length: 15 }, () => 2) as Array<0 | 1 | 2>;
      values[question] = value;
      assert.equal(scoreMap(answered(values))?.archetype, archetype);
    };
    only(1, 1, 'fragmentedWorkflow');
    only(4, 0, 'fragmentedWorkflow');
    only(5, 1, 'fragmentedWorkflow');
    only(7, 0, 'fragmentedWorkflow');
    only(9, 1, 'fragmentedWorkflow');
    only(10, 1, 'fragmentedWorkflow');
    only(13, 0, 'executionStall');
    only(0, 0, 'executionStall');
    only(3, 0, 'toolOverload');
    only(6, 0, 'bottleneckOperator');
    only(11, 0, 'bottleneckOperator');
    assert.equal(scoreMap(all(2))?.archetype, 'fragmentedWorkflow');
    assert.equal(archetypeFor([]), 'fragmentedWorkflow');
  });

  it('keeps option identity when two choices share a point value', () => {
    const answers = answered(Array.from({ length: 15 }, () => 2) as Array<0 | 1 | 2>);
    const scattered = QUESTIONS[2].choices[1];
    answers.values[2] = 0;
    answers.optionIds[2] = scattered.id;
    const score = scoreMap(answers);
    assert.equal(scattered.pressure, 'memory');
    assert.equal(score?.pressures[0], 'memory');
    assert.equal(answers.optionIds[2], 'q3-c2');
  });

  it('multiplies the preset hour range and clamps team size', () => {
    assert.deepEqual(teamHours('STALLED', 1), { low: 4, high: 8 });
    assert.deepEqual(teamHours('FRAGMENTED', 5), { low: 30, high: 60 });
    assert.equal(formatHours(teamHours('FRAGMENTED', 5).low, 0), '30');
    assert.equal(formatHours(teamHours('FRAGMENTED', 5).high, 0), '60');
    assert.equal(formatHours(10), '10');
    assert.equal(formatHours(2.5), '2.5');
    assert.equal(formatPressure(0.85), '0.85');
    assert.equal(clampTeam(0), 1);
    assert.equal(clampTeam(80), 50);
    assert.equal(clampTeam(4.4), 4);
  });

  it('suggests a department from the first pressure only', () => {
    assert.equal(suggestDepartment(['ownership', 'tools']), 'OPS');
    assert.equal(suggestDepartment(['revenue']), 'FIN');
    assert.equal(suggestDepartment([]), 'ACC');
    const pressures: PressureId[] = ['key-person'];
    assert.equal(suggestDepartment(pressures), 'HR');
  });
});

describe('operational accounting', () => {
  it('reproduces the approval-package week', () => {
    const sample = getDepartment('ACC').sample;
    assert.equal(repairHours(120, 0.3, 15), 9);
    assert.equal(repairHours(120, 0.1, 5), 1);
    const comparison = compareScenario(sample);
    assert.equal(comparison.baseline.repairHours, 9);
    assert.equal(comparison.baseline.requiredHours, 29);
    assert.ok(Math.abs((comparison.baseline.pressure ?? 0) - 29 / 27) < 1e-12);
    assert.equal(comparison.baseline.band, 'seized');
    assert.equal(comparison.baseline.queueState, 'no-steady-state');
    assert.equal(comparison.changed.repairHours, 1);
    assert.equal(comparison.changed.requiredHours, 21);
    assert.ok(Math.abs((comparison.changed.pressure ?? 0) - 21 / 27) < 1e-12);
    assert.equal(comparison.repairDeltaHours, 8);
    assert.equal(comparison.netReleasedHours, 6);
  });

  it('shows friction forming before the queue seizes', () => {
    const result = evaluateScenario(getDepartment('PR').sample);
    assert.equal(result.repairHours, 2.5);
    assert.equal(result.requiredHours, 8.5);
    assert.equal(result.pressure, 0.85);
    assert.equal(result.band, 'forming');
    assert.equal(result.queueState, 'finite-wait');
    assert.ok((result.waitMultiple ?? 0) > 5);
  });

  it('leaves blanks unknown and zero capacity unlabeled as a percentage', () => {
    const sample = { ...getDepartment('ACC').sample, itemCount: null };
    const unknown = evaluateScenario(sample);
    assert.equal(unknown.known, false);
    assert.equal(unknown.band, 'unknown');
    assert.equal(unknown.pressure, null);

    const unavailable = evaluateScenario({
      ...getDepartment('ACC').sample,
      availableHours: 0,
    });
    assert.equal(unavailable.band, 'unavailable');
    assert.equal(unavailable.pressure, null);
  });

  it('allows a connection that costs more than it saves', () => {
    const comparison = compareScenario({
      ...getDepartment('HR').sample,
      ongoingHours: 20,
    });
    assert.ok((comparison.netReleasedHours ?? 0) < 0);
  });
});

describe('agency balance', () => {
  it('pairs every desk with hours returned, review that stays, and a result to protect', () => {
    assert.equal(DEPARTMENTS.length, 10);
    for (const department of DEPARTMENTS) {
      const balance = AGENCY_BALANCE[department.id];
      assert.ok(balance.returnsTo.length > 0);
      assert.ok(balance.keeps.length > 0);
      assert.ok(balance.protects.length > 0);
    }
  });
});

describe('recorded manifestation index', () => {
  it('matches the revision-3 audit values', () => {
    const zeros = manifestation({
      answers: Array.from({ length: 15 }, () => 0),
      departmentId: 'ACC',
      modifierOn: false,
    });
    assert.ok(Math.abs(zeros.score - 6.244648356029608) < 1e-9);

    const answers = Array.from({ length: 15 }, () => 0) as Array<0 | 1 | 2>;
    answers[3] = 1;
    const raised = manifestation({ answers, departmentId: 'ACC', modifierOn: false });
    assert.equal(raised.raw, 1);
    assert.equal(raised.index, 3);
    assert.equal(raised.outputFactor, 0.35);
    assert.ok(Math.abs(raised.score - 15.752548011008598) < 1e-9);

    const full = manifestation({
      answers: Array.from({ length: 15 }, () => 2),
      departmentId: 'ACC',
      modifierOn: true,
    });
    assert.equal(full.score, 0);
    assert.equal(full.height, 0);
  });

  it('reduces the uncapped index by 0.25^1.8 when the modifier is on', () => {
    const off = manifestation({
      answers: Array.from({ length: 15 }, () => 0),
      departmentId: 'ACC',
      modifierOn: false,
    });
    const on = manifestation({
      answers: Array.from({ length: 15 }, () => 0),
      departmentId: 'ACC',
      modifierOn: true,
    });
    assert.ok(Math.abs(on.score / off.score - Math.pow(0.25, 1.8)) < 1e-9);
  });
});
