import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lowLine } from '../src/components/ProofResult';

const N = ['Process', 'Review', 'Observing', 'Operational', 'Friction'];

test('low line counts 0-point answers and names the section with most', () => {
  assert.equal(lowLine([2, 2, 2, 0, 0, 1, 2, 2, 2, 0, 0, 0, 2, 1, 2], N), '5 of 15 answers scored low. Most are in Operational.');
  assert.equal(lowLine([2, 2, 2, 0, 0, 1, 2, 2, 2, 0, 0, 2, 2, 1, 2], N), '4 of 15 answers scored low. Most are in Review and Operational.');
});

test('low line falls back to 1-point answers, and handles all low', () => {
  assert.equal(lowLine([2, 2, 2, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2], N), 'No answer scored 0. 3 of 15 scored 1 of 2. Most are in Review.');
  assert.equal(lowLine(Array(15).fill(0), N), 'All 15 answers scored low.');
  assert.equal(lowLine(Array(15).fill(2), N), 'All 15 answers scored 2 of 2.');
});
