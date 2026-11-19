import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AUDIENCES, AUDIENCE_ORDER } from '../src/lib/audiences';
import { PRESSURE_LABEL, QUESTIONS } from '../src/lib/questionnaire';

describe('audience wording', () => {
  it('keeps 15 questions and 60 choices for every audience', () => {
    for (const id of AUDIENCE_ORDER) {
      const audience = AUDIENCES[id];
      assert.equal(audience.questions.length, QUESTIONS.length, id);
      assert.equal(audience.choices.length, QUESTIONS.length, id);
      audience.choices.forEach((row, index) => assert.equal(row.length, QUESTIONS[index].choices.length, `${id} q${index + 1}`));
    }
  });

  it('labels every pressure id', () => {
    for (const id of AUDIENCE_ORDER) {
      for (const key of Object.keys(PRESSURE_LABEL)) {
        assert.ok(AUDIENCES[id].pressure[key as keyof typeof PRESSURE_LABEL], `${id} ${key}`);
      }
    }
  });

  it('has no em or en dashes in visible wording', () => {
    for (const id of AUDIENCE_ORDER) {
      const a = AUDIENCES[id];
      const text = [a.label, a.moment, ...a.questions, ...a.choices.flat(), ...Object.values(a.pressure), ...Object.values(a.archetype), ...Object.values(a.profile)].join('\n');
      assert.ok(!/[\u2013\u2014]/.test(text), id);
    }
  });

  it('does not touch scoring: choice ids and values come from the catalog', () => {
    assert.equal(QUESTIONS.flatMap((q) => q.choices).length, 60);
    assert.deepEqual(QUESTIONS.map((q) => q.choices.map((c) => c.value)), [
      [0, 1, 1, 2], [0, 1, 1, 2], [0, 0, 1, 2], [1, 1, 1, 2], [0, 1, 1, 2],
      [0, 0, 1, 2], [0, 1, 1, 2], [0, 1, 1, 2], [0, 0, 1, 2], [0, 0, 1, 2],
      [0, 0, 1, 2], [0, 0, 1, 2], [0, 1, 1, 2], [0, 1, 1, 2], [0, 0, 1, 2],
    ]);
  });
});
