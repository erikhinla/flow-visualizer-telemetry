import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CLICK_EVENTS,
  EMAIL_RE,
  MAX_BODY_BYTES,
  dayStamp,
  parseEvent,
  parseLeadBody,
  parseTrackBody
} from '../src/lib/clicks-store';

const VALID = {
  event: 'review_click',
  time: '2026-11-25T12:00:00.000Z',
  page: '/proof/screen',
  utm_source: 'x',
  utm_medium: 'no_webgl',
  utm_campaign: 'crash_launch',
  utm_content: 'test',
  via: 'crash'
};

describe('click allowlist', () => {
  it('accepts exactly the four button names', () => {
    assert.deepEqual([...CLICK_EVENTS].sort(), ['back_click', 'fact_click', 'review_click', 'review_click_quiet']);
    for (const name of CLICK_EVENTS) {
      assert.ok(parseEvent({ ...VALID, event: name }), name);
    }
  });

  it('rejects an unlisted event name', () => {
    assert.equal(parseEvent({ ...VALID, event: 'stripe_pay_click' }), null);
    assert.equal(parseEvent({ ...VALID, event: '' }), null);
    assert.equal(parseEvent({ ...VALID, event: 42 }), null);
  });

  it('rejects unknown fields instead of storing them', () => {
    for (const extra of [{ ip: '1.2.3.4' }, { userAgent: 'x' }, { score: 12 }, { answers: [1, 2] }, { email: 'a@b.co' }]) {
      assert.equal(parseEvent({ ...VALID, ...extra }), null, JSON.stringify(extra));
    }
  });

  it('carries only the utm tags and via', () => {
    const row = parseEvent({ ...VALID, utm_term: 'seo', cookie_id: 'abc' });
    assert.equal(row, null, 'utm_term is not an allowed key');
    const kept = parseEvent(VALID);
    assert.deepEqual(Object.keys(kept!).sort(), ['page', 'time', 'via', 'event', 'utm_campaign', 'utm_content', 'utm_medium', 'utm_source'].sort());
    assert.equal(kept!.utm_medium, 'no_webgl');
    assert.equal(kept!.via, 'crash');
  });

  it('falls back to server time on a bad timestamp and never trusts the visitor clock format', () => {
    const row = parseEvent({ ...VALID, time: 'yesterday' });
    assert.ok(row);
    assert.match(row!.time, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('strips control characters and caps long values', () => {
    const row = parseEvent({ ...VALID, page: '/' + 'a'.repeat(5000), utm_source: 'x'.repeat(900), event: 'review_click' });
    assert.ok(row);
    assert.ok(row!.page.length <= 300, 'page capped');
    assert.ok(row!.utm_source!.length <= 120, 'utm capped');
    const dirty = parseEvent({ ...VALID, utm_campaign: 'ok\ninjected' });
    assert.ok(dirty && !/[\n\r]/.test(dirty.utm_campaign!), 'newline removed so one row stays one line');
  });
});

describe('track body', () => {
  it('accepts a single event object and a batch', () => {
    const single = parseTrackBody(JSON.stringify(VALID));
    assert.equal(single.ok, true);
    assert.equal((single as { rows: unknown[] }).rows.length, 1);
    const batch = parseTrackBody(JSON.stringify({ events: [VALID, { ...VALID, event: 'fact_click' }] }));
    assert.equal(batch.ok, true);
    assert.equal((batch as { rows: unknown[] }).rows.length, 2);
  });

  it('rejects bad JSON, an empty batch, an oversized batch and a non-object', () => {
    assert.equal(parseTrackBody('{nope').ok, false);
    assert.equal(parseTrackBody(JSON.stringify({ events: [] })).ok, false);
    assert.equal(parseTrackBody(JSON.stringify({ events: Array(21).fill(VALID) })).ok, false);
    assert.equal(parseTrackBody('"hello"').ok, false);
    assert.equal(parseTrackBody('').ok, false);
  });

  it('keeps the body cap small', () => {
    assert.equal(MAX_BODY_BYTES, 4096);
  });
});

describe('leads body', () => {
  it('accepts a valid lead with tags', () => {
    const r = parseLeadBody(JSON.stringify({ email: 'owner@agency.com', name: 'Dana', page: '/proof/screen', utm_source: 'x', via: 'crash' }));
    assert.equal(r.ok, true);
    const row = (r as { row: { email: string; tags?: Record<string, string> } }).row;
    assert.equal(row.email, 'owner@agency.com');
    assert.equal(row.tags!.utm_source, 'x');
    assert.equal(row.tags!.via, 'crash');
  });

  it('rejects malformed and hostile emails', () => {
    for (const email of ['', 'nope', 'a@b', 'a@b.', 'a b@c.co', 'a@b.co\nsecond line', 'x'.repeat(300) + '@y.co']) {
      assert.equal(parseLeadBody(JSON.stringify({ email })).ok, false, JSON.stringify(email));
    }
    assert.ok(EMAIL_RE.test('a.b+c@agency.example.com'));
  });

  it('accepts the exact Context Crash debrief payload', () => {
    const crashPost = {
      name: 'Dana',
      email: 'owner@agency.com',
      consent: true,
      dept: 'Creative',
      score: 10,
      utm_source: 'context_crash',
      utm_medium: 'no_webgl',
      utm_campaign: 'crash_launch',
      utm_content: 'test',
      ts: '2026-11-25T06:30:00.000Z'
    };
    const r = parseLeadBody(JSON.stringify(crashPost));
    assert.equal(r.ok, true, JSON.stringify(r));
    const row = (r as { row: Record<string, unknown> }).row;
    assert.equal(row.time, '2026-11-25T06:30:00.000Z', 'ts becomes the row time');
    assert.equal(row.consent, true);
    assert.equal(row.dept, 'Creative');
    assert.equal(row.score, 10);
    assert.equal((row.tags as Record<string, string>).utm_content, 'test');
  });

  it('still refuses free text, ip and identifiers on a lead', () => {
    for (const extra of [{ ip: '1.2.3.4' }, { userAgent: 'Mozilla' }, { message: 'hello' }, { answers: [1, 2] }, { cookie: 'x' }]) {
      assert.equal(parseLeadBody(JSON.stringify({ email: 'a@b.co', ...extra })).ok, false, JSON.stringify(extra));
    }
  });

  it('drops unusable score and consent values instead of guessing', () => {
    const row = (parseLeadBody(JSON.stringify({ email: 'a@b.co', score: 'lots', consent: 'yes', dept: 'd'.repeat(500) })) as { row: Record<string, unknown> }).row;
    assert.equal('score' in row, false);
    assert.equal('consent' in row, false);
    assert.ok(String(row.dept).length <= 40, 'dept capped');
    const clamped = (parseLeadBody(JSON.stringify({ email: 'a@b.co', score: 99999 })) as { row: { score: number } }).row;
    assert.equal(clamped.score, 1000, 'score clamped');
  });

  it('rejects unknown fields and non-objects', () => {
    assert.equal(parseLeadBody(JSON.stringify({ email: 'a@b.co', ip: '1.2.3.4' })).ok, false);
    assert.equal(parseLeadBody(JSON.stringify({ email: 'a@b.co', message: 'hello' })).ok, false);
    assert.equal(parseLeadBody(JSON.stringify([{ email: 'a@b.co' }])).ok, false);
    assert.equal(parseLeadBody('{').ok, false);
  });
});

describe('day rotation', () => {
  it('stamps UTC dates so files rotate on the server clock', () => {
    assert.equal(dayStamp(new Date('2026-11-25T23:59:59Z')), '2026-11-25');
    assert.equal(dayStamp(new Date('2026-12-01T00:00:00Z')), '2026-12-01');
    assert.match(dayStamp(), /^\d{4}-\d{2}-\d{2}$/);
  });
});
