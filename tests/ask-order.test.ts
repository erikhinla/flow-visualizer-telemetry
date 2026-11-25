import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ASK_ORDER, QUESTIONS } from '../src/lib/questionnaire';
import { DIMENSIONS } from '../src/lib/math';

test('ask order covers every question once', () => {
  assert.equal(ASK_ORDER.length, QUESTIONS.length);
  assert.deepEqual([...ASK_ORDER].sort((a, b) => a - b), QUESTIONS.map((_, i) => i));
});

test('each PROOF word gets the next three questions asked', () => {
  DIMENSIONS.forEach((d, i) => {
    assert.deepEqual([...d.questions], ASK_ORDER.slice(i * 3, i * 3 + 3));
  });
  assert.deepEqual(DIMENSIONS.map((d) => d.name), ['Process', 'Review', 'Observing', 'Operational', 'Friction']);
});
