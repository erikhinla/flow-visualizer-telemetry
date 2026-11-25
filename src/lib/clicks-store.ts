import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './fulfil';

/** Server-only storage for visit and click counting. Rows stay on this machine. */
export const ANALYTICS_DIR = path.join(DATA_DIR, 'analytics');
export const LEADS_DIR = path.join(DATA_DIR, 'leads');

/** One file per UTC day. A runaway poster cannot fill the disk: past the cap, rows drop and the route still answers 202. */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_BODY_BYTES = 4096;
export const MAX_EVENTS_PER_POST = 20;

/** The only click names the endpoint accepts. Four buttons in the results view. */
export const CLICK_EVENTS = ['review_click', 'review_click_quiet', 'fact_click', 'back_click'] as const;
export type ClickEvent = (typeof CLICK_EVENTS)[number];

/** The only tags a visit may carry. No cookie, no ip, no user agent, no answers, no score. */
export const TAG_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'via'] as const;
export type TagKey = (typeof TAG_KEYS)[number];

const LIMITS: Record<string, number> = { event: 40, page: 300, email: 254, name: 120 };
for (const k of TAG_KEYS) LIMITS[k] = 120;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface ClickRow { time: string; event: ClickEvent; page: string }
export type TagRow = Partial<Record<TagKey, string>>;
export interface TrackRow extends ClickRow { }
export interface LeadRow { time: string; email: string; name?: string; page: string }
export type LeadStored = LeadRow & { tags?: TagRow };

function clean(value: unknown, cap: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, cap);
  return trimmed || null;
}

/** UTC day stamp, so rotation follows the server clock and not the visitor's. */
export function dayStamp(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Strict allowlist. Unknown keys, unknown event names and bad types all reject the event. */
export function parseEvent(input: unknown): (TrackRow & TagRow) | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const allowed = new Set(['event', 'time', 'page', ...TAG_KEYS]);
  for (const key of Object.keys(record)) if (!allowed.has(key)) return null;

  const event = clean(record.event, LIMITS.event);
  if (!event || !(CLICK_EVENTS as readonly string[]).includes(event)) return null;
  const page = clean(record.page, LIMITS.page) ?? '';
  const time = clean(record.time, 40);
  const row: TrackRow & TagRow = {
    time: time && !Number.isNaN(Date.parse(time)) ? new Date(time).toISOString() : new Date().toISOString(),
    event: event as ClickEvent,
    page
  };
  for (const key of TAG_KEYS) {
    const tag = clean(record[key], LIMITS[key]);
    if (tag) row[key] = tag;
  }
  return row;
}

export type ParseResult = { ok: true; rows: (TrackRow & TagRow)[] } | { ok: false; error: string };

/** Accepts one event object or a batch. Mirrors lib/telemetry.ts, which rejects the whole batch on one bad event. */
export function parseTrackBody(text: string): ParseResult {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Expected JSON.' };
  }
  const raw: unknown[] = Array.isArray((body as { events?: unknown })?.events)
    ? (body as { events: unknown[] }).events
    : [body];
  if (raw.length < 1) return { ok: false, error: 'Expected at least one event.' };
  if (raw.length > MAX_EVENTS_PER_POST) return { ok: false, error: `Expected at most ${MAX_EVENTS_PER_POST} events.` };
  const rows: (TrackRow & TagRow)[] = [];
  for (const item of raw) {
    const parsed = parseEvent(item);
    if (!parsed) return { ok: false, error: 'Event schema rejected.' };
    rows.push(parsed);
  }
  return { ok: true, rows };
}

export type LeadResult = { ok: true; row: LeadStored } | { ok: false; error: string };

function cleanBool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function cleanInt(value: unknown, max: number): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(max, Math.round(n)));
}

/**
 * Lead shape comes from the Context Crash debrief form, which posts
 * { name, email, consent, dept, score, utm_*, ts }. Consent is stored because it is the
 * record that the visitor asked for the score by email. Still no ip, user agent or free text.
 */
export function parseLeadBody(text: string): LeadResult {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Expected JSON.' };
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Expected an object.' };
  const record = body as Record<string, unknown>;
  const allowed = new Set(['email', 'name', 'page', 'time', 'ts', 'consent', 'dept', 'score', ...TAG_KEYS]);
  for (const key of Object.keys(record)) if (!allowed.has(key)) return { ok: false, error: 'Unknown field.' };

  const email = clean(record.email, LIMITS.email);
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: 'Expected a valid email.' };
  const name = clean(record.name, LIMITS.name);
  const page = clean(record.page, LIMITS.page) ?? '';
  const dept = clean(record.dept, 40);
  const score = cleanInt(record.score, 1000);
  const consent = cleanBool(record.consent);
  const stamp = clean(record.ts, 40) || clean(record.time, 40);
  const tags: TagRow = {};
  for (const key of TAG_KEYS) {
    const tag = clean(record[key], LIMITS[key]);
    if (tag) tags[key] = tag;
  }
  return {
    ok: true,
    row: {
      time: stamp && !Number.isNaN(Date.parse(stamp)) ? new Date(stamp).toISOString() : new Date().toISOString(),
      email,
      ...(name ? { name } : {}),
      ...(dept ? { dept } : {}),
      ...(score !== null ? { score } : {}),
      ...(consent !== null ? { consent } : {}),
      page,
      ...(Object.keys(tags).length ? { tags } : {})
    }
  };
}

let chain: Promise<unknown> = Promise.resolve();

/** Append one JSON line. Serialised so concurrent posts cannot interleave a partial row. False means dropped by the cap. */
function appendLine(dir: string, file: string, line: string): Promise<boolean> {
  const run = chain.then(async () => {
    await fs.mkdir(dir, { recursive: true });
    const full = path.join(dir, file);
    try {
      const stat = await fs.stat(full);
      if (stat.size > MAX_FILE_BYTES) return false;
    } catch {
      /* first row of the day */
    }
    await fs.appendFile(full, `${line}\n`, 'utf8');
    return true;
  });
  chain = run.catch(() => undefined);
  return run;
}

export function storeClick(row: TrackRow & TagRow, now: Date = new Date()): Promise<boolean> {
  return appendLine(ANALYTICS_DIR, `events-${dayStamp(now)}.jsonl`, JSON.stringify(row));
}

export function storeLead(row: LeadStored, now: Date = new Date()): Promise<boolean> {
  return appendLine(LEADS_DIR, `leads-${dayStamp(now)}.jsonl`, JSON.stringify(row));
}
