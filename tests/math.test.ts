import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { liveMath, RAW_MAX, BANDS } from '../src/lib/math';
import { QUESTIONS, emptyAnswers, profileFor, scoreMap } from '../src/lib/questionnaire';

describe('live math mirrors scoreMap', () => {
  it('agrees with scoreMap on raw, index and profile for every uniform pick', () => {
    for (let pick = 0; pick < 4; pick += 1) {
      const answers = { values: QUESTIONS.map((q) => q.choices[pick].value), optionIds: QUESTIONS.map((q) => q.choices[pick].id) };
      const live = liveMath(answers);
      const score = scoreMap(answers)!;
      assert.equal(live.raw, score.raw);
      assert.equal(live.index, score.index);
      assert.equal(live.profile, score.profile);
      assert.equal(live.dimensions.reduce((s, d) => s + d.points, 0), score.raw);
      assert.equal(live.pressureAtZero + live.pressureAtOne, score.allPressures.length);
    }
  });
  it('shows no index until all 15 are answered, and a correct range', () => {
    const live = liveMath(emptyAnswers());
    assert.equal(live.index, null);
    assert.equal(live.ceiling, RAW_MAX);
    assert.equal(RAW_MAX, 30);
  });
  it('bands match profileFor', () => {
    for (const band of BANDS) for (let r = band.from; r <= band.to; r += 1) assert.equal(profileFor(r), band.id);
  });
});
