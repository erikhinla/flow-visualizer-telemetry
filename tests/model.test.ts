import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AGENCY_BALANCE } from '../src/lib/agency';
import { DEPARTMENTS, getDepartment } from '../src/lib/departments';
import { commitNumeric, formatHours, formatPressure, formatWait } from '../src/lib/format';
import { manifestation } from '../src/lib/manifestation';
import { balanceReason, compareScenario, evaluateScenario, repairHours, scenarioDirty } from '../src/lib/operational';
import { presentedEvidence } from '../src/lib/evidence';
import { createDefaultSession, editSession, parseSession, withDepartment } from '../src/lib/session';
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
import { DESK_TRACE, factState, showSeat } from '../src/lib/trace';
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
    assert.equal(score?.archetype, 'bottleneckOperator');
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
    assert.equal(scoreMap(all(2))?.archetype, null);
    assert.equal(archetypeFor([]), null);
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
    assert.equal(suggestDepartment([]), null);
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

describe('trace', () => {
  it('reads fog, friction, seizure, and an untraced desk from the display band', () => {
    assert.equal(factState('unknown', null), 'untraced');
    assert.equal(factState('unavailable', 4), 'untraced');
    assert.equal(factState('seized', 9), 'seized');
    assert.equal(factState('forming', 2.5), 'friction');
    assert.equal(factState('closing', 2.5), 'friction');
    assert.equal(factState('fog', 1), 'fog');
    assert.equal(factState('open', 0), 'held');
    assert.equal(factState('open', 1), 'fog');
  });

  it('gives every desk four facts and the four keystones', () => {
    const factIds = ['where', 'what', 'who', 'when'];
    const stoneIds = ['folders', 'markdown', 'scripts', 'protocols'];
    const stoneNames = ['Folders', 'Markdown', 'Scripts', 'Protocols'];
    for (const department of DEPARTMENTS) {
      const trace = DESK_TRACE[department.id];
      assert.deepEqual(
        trace.facts.map((fact) => fact.id),
        factIds
      );
      assert.deepEqual(
        trace.keystones.map((stone) => stone.id),
        stoneIds
      );
      assert.deepEqual(
        trace.keystones.map((stone) => stone.name),
        stoneNames
      );
      for (const fact of trace.facts) {
        assert.ok(fact.now.length > 0);
        assert.ok(fact.held.length > 0);
      }
      for (const stone of trace.keystones) {
        assert.ok(stone.holds.length > 0);
        assert.ok(stone.action.length > 0);
      }
    }
  });

  it('keeps the seat on an unavailable desk and hides it when the band is unknown', () => {
    assert.equal(showSeat('unavailable', true), true);
    assert.equal(showSeat('unknown', true), false);
    assert.equal(showSeat('forming', false), false);
  });
});

describe('desk honesty', () => {
  it('says Unknown when the wait is null, and commits a trailing decimal draft', () => {
    assert.equal(formatWait(null), 'Unknown');
    assert.equal(commitNumeric(''), null);
    assert.equal(commitNumeric('1.'), undefined);
    assert.equal(commitNumeric('.'), undefined);
    assert.equal(commitNumeric('.5'), 0.5);
    assert.equal(commitNumeric('1.5'), 1.5);
  });

  it('names a balance reason for each null net', () => {
    assert.equal(
      balanceReason({
        compareOff: true,
        baselineKnown: true,
        changedKnown: true,
        ongoingHours: 1,
        net: 1,
      }),
      'compare-off'
    );
    assert.equal(
      balanceReason({
        baselineKnown: false,
        changedKnown: true,
        ongoingHours: 1,
        net: null,
      }),
      'baseline-unknown'
    );
    assert.equal(
      balanceReason({
        baselineKnown: true,
        changedKnown: false,
        ongoingHours: 1,
        net: null,
      }),
      'changed-invalid'
    );
    assert.equal(
      balanceReason({
        baselineKnown: true,
        changedKnown: true,
        ongoingHours: -1,
        net: null,
      }),
      'ongoing-blank'
    );
    assert.equal(
      balanceReason({
        baselineKnown: true,
        changedKnown: true,
        ongoingHours: null,
        net: null,
      }),
      'ongoing-blank'
    );
    const sample = getDepartment('PR').sample;
    const comparison = compareScenario(sample);
    assert.equal(
      balanceReason({
        baselineKnown: comparison.baseline.known,
        changedKnown: comparison.changed.known,
        ongoingHours: sample.ongoingHours,
        net: comparison.netReleasedHours,
      }),
      'known'
    );
  });

  it('keeps a later unedited Account Management choice and drops the legacy blob', () => {
    const chosen = withDepartment(createDefaultSession(), 'ACC');
    const raw = JSON.stringify(chosen);
    assert.equal(parseSession(raw)?.departmentId, 'ACC');
    const legacy = JSON.parse(raw) as Record<string, unknown>;
    delete legacy.attested;
    assert.equal(parseSession(JSON.stringify(legacy)), null);
  });

  it('returns Estimated after an attested figure is edited', () => {
    const sample = getDepartment('PR').sample;
    let session = createDefaultSession();
    session = { ...session, evidenceKind: 'observed', attested: true, inputs: { ...sample, itemCount: 3 } };
    session = editSession(session, { itemCount: 4 });
    assert.equal(session.attested, false);
    assert.equal(session.evidenceKind, 'estimated');
    const view = presentedEvidence({
      evidenceKind: session.evidenceKind,
      attested: session.attested,
      dirty: scenarioDirty(session.inputs, sample),
      known: true,
    });
    assert.equal(view.kind, 'estimated');
  });
});
