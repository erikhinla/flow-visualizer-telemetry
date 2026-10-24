import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QUESTIONS, emptyAnswers, isComplete, scoreMap } from '../src/lib/questionnaire';
import { decodeHandoff, encodeHandoff, handoffPath } from '../src/lib/handoff';
import { MAP_MODEL_VERSION } from '../src/lib/types';

function answersFor(indices: number[]) {
  const answers = emptyAnswers();
  QUESTIONS.forEach((q, i) => {
    answers.values[i] = q.choices[indices[i]].value;
    answers.optionIds[i] = q.choices[indices[i]].id;
  });
  return answers;
}
function encodeRaw(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

describe('one Scan contract', () => {
  it('preserves the 60 saved points and canonical option identities', () => {
    const points = [
      [0,1,1,2], [0,1,1,2], [0,0,1,2], [1,1,1,2], [0,1,1,2],
      [0,0,1,2], [0,1,1,2], [0,1,1,2], [0,0,1,2], [0,0,1,2],
      [0,0,1,2], [0,0,1,2], [0,1,1,2], [0,1,1,2], [0,0,1,2],
    ];
    assert.deepEqual(QUESTIONS.map(q => q.choices.map(c => c.value)), points);
    assert.deepEqual(QUESTIONS.map(q => q.id), Array.from({length:15}, (_,i) => `q${i+1}`));
  });
  it('matches the generated film module across all options and mixed profiles', async () => {
    const shared = await import(new URL('../public/proof-scan.mjs', import.meta.url).href);
    assert.equal(shared.MAP_MODEL_VERSION, MAP_MODEL_VERSION);
    assert.deepEqual(shared.QUESTIONS, QUESTIONS);
    for (let i=0;i<15;i++) for (let c=0;c<4;c++) {
      const indices = Array(15).fill(3); indices[i]=c;
      const answers = answersFor(indices);
      assert.deepEqual(shared.scoreMap(answers), scoreMap(answers));
      assert.deepEqual(shared.decodeHandoff(shared.encodeHandoff(answers)), decodeHandoff(encodeHandoff(answers)));
    }
    let seed=20261005;
    for (let n=0;n<128;n++) {
      const indices=Array.from({length:15}, () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed>>>30; });
      assert.deepEqual(shared.scoreMap(answersFor(indices)), scoreMap(answersFor(indices)));
    }
  });
  it('keeps answer score and profile monotonic for every local improvement in mixed fixtures', () => {
    const bands=['FRAGMENTED','STALLED','SCALING','COMPOUNDING'];
    let seed=5;
    for(let n=0;n<32;n++) {
      const indices=Array.from({length:15}, () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed>>>30; });
      const baseline=scoreMap(answersFor(indices))!;
      for(let i=0;i<15;i++) for(let c=0;c<4;c++) {
        if(QUESTIONS[i].choices[c].value <= QUESTIONS[i].choices[indices[i]].value) continue;
        const changed=[...indices]; changed[i]=c;
        const next=scoreMap(answersFor(changed))!;
        assert.ok(next.raw>baseline.raw);
        assert.ok(next.index>=baseline.index);
        assert.ok(bands.indexOf(next.profile)>=bands.indexOf(baseline.profile));
      }
    }
  });
  it('routes from pressures beyond the displayed four and leaves perfect answers without a problem archetype', () => {
    const answers=answersFor([0,0,0,0,3,3,0,3,3,3,3,3,3,3,3]);
    const result=scoreMap(answers)!;
    assert.equal(result.pressures.length,4);
    assert.equal(result.archetype,'bottleneckOperator');
    const perfect=decodeHandoff(encodeHandoff(answersFor(Array(15).fill(3))))!;
    assert.equal(perfect.score.profile,'COMPOUNDING');
    assert.equal(perfect.score.archetype,null);
    assert.equal(perfect.departmentId,null);
  });
  it('rejects missing or mismatched values and choice ids', () => {
    const answers=answersFor(Array(15).fill(3));
    answers.optionIds[0]='q2-c4';
    assert.equal(isComplete(answers),false);
    assert.equal(scoreMap(answers),null);
    assert.throws(() => encodeHandoff(answers));
    answers.optionIds[0]='q1-c4'; answers.values[0]=0;
    assert.equal(scoreMap(answers),null);
  });
});

describe('completed film handoff', () => {
  it('round-trips choices and recomputes the Scan and function locally', () => {
    const answers=answersFor([1,...Array(14).fill(3)]);
    const encoded=encodeHandoff(answers);
    const result=decodeHandoff(encoded)!;
    assert.deepEqual(result.answers,answers);
    assert.deepEqual(result.score,scoreMap(answers));
    assert.equal(result.departmentId,'ACC');
    assert.equal(handoffPath(answers),`/proof/screen/visualizer#proof=${encoded}`);
    assert.equal(handoffPath(answers).includes('?'),false);
  });
  it('rejects unknown versions, forged summaries, wrong question ids, incomplete and oversized payloads', () => {
    const valid={v:1,m:MAP_MODEL_VERSION,c:QUESTIONS.map(q=>q.choices[3].id)};
    const invalid=[
      {...valid,v:2}, {...valid,m:'old-model'}, {...valid,score:100},
      {...valid,c:valid.c.slice(1)}, {...valid,c:['q2-c4',...valid.c.slice(1)]},
      {...valid,c:[null,...valid.c.slice(1)]}, [], null,
    ];
    for(const payload of invalid) assert.equal(decodeHandoff(encodeRaw(payload)),null);
    for(const encoded of ['bad','%','', 'x'.repeat(1025)]) assert.equal(decodeHandoff(encoded),null);
  });
});
