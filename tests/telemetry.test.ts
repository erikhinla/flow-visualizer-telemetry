import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_BYTES, validateBatch } from '../src/lib/telemetry';

describe('telemetry batch', () => {
  it('accepts one event and rejects a payload of values', () => {
    const ok = validateBatch(JSON.stringify({ events: [{ name: 'map-complete' }] }));
    assert.deepEqual(ok, { ok: true, events: [{ name: 'map-complete' }] });
    const bad = validateBatch(
      JSON.stringify({ events: [{ name: 'map-complete', payload: { values: [1] } }] })
    );
    assert.equal(bad.ok, false);
  });

  it('rejects 41 events and an oversized body, and accepts a small body', () => {
    const events = Array.from({ length: 41 }, () => ({ name: 'map-complete' }));
    assert.equal(validateBatch(JSON.stringify({ events })).ok, false);
    const oversized = validateBatch(JSON.stringify({ events: [{ name: 'map-complete', pad: 'x'.repeat(MAX_BYTES) }] }));
    assert.equal(oversized.ok, false);
    const small = validateBatch(JSON.stringify({ events: [{ name: 'desk-open', department: 'PR' }] }));
    assert.equal(small.ok, true);
    if (small.ok) assert.equal(small.events.length, 1);
  });
});