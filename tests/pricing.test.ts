import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateEngagementPrice } from '../src/lib/pricing';
import { manifestation } from '../src/lib/manifestation';

describe('locked PROOF indicative pricing', () => {
  it('reproduces all four supplied worked examples', () => {
    for (const [score, annualLoad, rawEngagementPrice, finalPrice, floorApplied] of [
      [42, 39900, 5985, 5985, false],
      [68, 64600, 9690, 9690, false],
      [25, 23750, 3562.5, 3563, false],
      [8, 7600, 1140, 1500, true],
    ] as const) {
      const actual = calculateEngagementPrice(score);
      assert.ok(Math.abs(actual.annualLoad - annualLoad) < 1e-8);
      assert.ok(Math.abs(actual.rawEngagementPrice - rawEngagementPrice) < 1e-8);
      assert.equal(actual.finalPrice, finalPrice);
      assert.equal(actual.floorApplied, floorApplied);
    }
  });
  it('keeps the floor at zero and the capped-index maximum at 100', () => {
    assert.equal(calculateEngagementPrice(0).finalPrice, 1500);
    assert.equal(calculateEngagementPrice(100).finalPrice, 14250);
  });
  it('rounds before applying the floor and preserves unrounded intermediates', () => {
    const quote = calculateEngagementPrice(1499.6 / 142.5);
    assert.equal(quote.finalPrice, 1500);
    assert.equal(quote.floorApplied, false);
    assert.ok(Math.abs(quote.rawEngagementPrice - 1499.6) < 1e-9);
  });
  it('rejects invalid scores rather than coercing or clamping them', () => {
    for (const score of [-1, 101, NaN, Infinity, -Infinity, null, '42', undefined]) {
      assert.throws(() => calculateEngagementPrice(score as number), RangeError);
    }
  });
  it('prices the manifestation score, independently of the answer-average index', () => {
    const model = manifestation({ answers: Array(15).fill(1), departmentId: 'OPS', modifierOn: false });
    assert.notEqual(model.score, model.index);
    assert.notEqual(calculateEngagementPrice(model.score).finalPrice, calculateEngagementPrice(model.index).finalPrice);
  });
});

import { POST } from '../src/app/api/engagement-price/route';
import { QUESTIONS } from '../src/lib/questionnaire';

describe('standalone pricing endpoint', () => {
  it('derives values from choice identities and ignores forged client scores', async () => {
    const optionIds = QUESTIONS.map((question) => question.choices[1].id);
    const response = await POST(new Request('http://localhost/api/engagement-price', {
      method: 'POST', body: JSON.stringify({ optionIds, departmentId: 'FIN', score: 100, finalPrice: 1 }),
    }));
    const quote = await response.json();
    const score = manifestation({ answers: QUESTIONS.map((q) => q.choices[1].value), departmentId: 'FIN', modifierOn: false }).score;
    assert.equal(quote.finalPrice, calculateEngagementPrice(score).finalPrice);
    assert.equal(quote.score, score);
    for (const privateKey of ['departmentFactor', 'outputFactor', 'fragility', 'effectiveFragility', 'height', 'weights']) {
      assert.equal(Object.prototype.hasOwnProperty.call(quote, privateKey), false);
    }
  });
  it('rejects partial answers, wrong question choices and unsupported departments', async () => {
    const optionIds = QUESTIONS.map((question) => question.choices[1].id);
    for (const body of [
      { optionIds: optionIds.slice(1), departmentId: 'OPS' },
      { optionIds: Array(15).fill(optionIds[0]), departmentId: 'OPS' },
      { optionIds, departmentId: 'IT' },
    ]) {
      const response = await POST(new Request('http://localhost/api/engagement-price', { method: 'POST', body: JSON.stringify(body) }));
      assert.equal(response.status, 400);
    }
  });
});

it('preserves the selected modifier through the standalone endpoint', async () => {
  const optionIds = QUESTIONS.map((q) => q.choices[1].id);
  for (const modifierOn of [false, true]) {
    const response = await POST(new Request('http://localhost/api/engagement-price', {
      method: 'POST', body: JSON.stringify({ optionIds, departmentId: 'OPS', modifierOn }),
    }));
    const body = await response.json();
    const result = manifestation({ answers: QUESTIONS.map((q) => q.choices[1].value), departmentId: 'OPS', modifierOn });
    assert.equal(body.modifierOn, modifierOn);
    assert.equal(body.score, result.score);
    assert.equal(body.finalPrice, calculateEngagementPrice(result.score).finalPrice);
  }
});
