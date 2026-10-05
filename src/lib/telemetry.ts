import { isDepartmentId } from './departments';
import type { DepartmentId } from './types';

export const DIAGNOSTICS_KEY = 'flow.visualizer.diagnostics.v1';
export const MAX_EVENTS = 40;
export const MAX_BYTES = 8192;

export type TraceEvent =
  | { name: 'map-complete' }
  | { name: 'desk-open'; department: DepartmentId }
  | { name: 'record-open'; department: DepartmentId }
  | { name: 'record-export'; department: DepartmentId };

const WITH_DEPARTMENT = new Set(['desk-open', 'record-open', 'record-export']);

export type BatchResult =
  | { ok: true; events: TraceEvent[] }
  | { ok: false; error: string };

/** Atomic check. One bad event, a bad length, or more than 8,192 UTF-8 octets rejects the batch. */
export function validateBatch(text: string): BatchResult {
  if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) {
    return { ok: false, error: 'Body is larger than 8192 bytes.' };
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Expected JSON.' };
  }
  if (!body || typeof body !== 'object' || !Array.isArray((body as { events?: unknown }).events)) {
    return { ok: false, error: 'Expected an events array.' };
  }
  const events = (body as { events: unknown[] }).events;
  if (events.length < 1 || events.length > MAX_EVENTS) {
    return { ok: false, error: 'Expected 1 to 40 events.' };
  }
  const accepted: TraceEvent[] = [];
  for (const event of events) {
    const parsed = parseEvent(event);
    if (!parsed) return { ok: false, error: 'Event schema rejected.' };
    accepted.push(parsed);
  }
  return { ok: true, events: accepted };
}

function parseEvent(event: unknown): TraceEvent | null {
  if (!event || typeof event !== 'object' || Array.isArray(event)) return null;
  const record = event as Record<string, unknown>;
  const keys = Object.keys(record);
  if (typeof record.name !== 'string') return null;
  if (record.name === 'map-complete') {
    return keys.length === 1 ? { name: 'map-complete' } : null;
  }
  if (!WITH_DEPARTMENT.has(record.name)) return null;
  if (keys.length !== 2 || !Object.prototype.hasOwnProperty.call(record, 'department')) return null;
  if (typeof record.department !== 'string' || !isDepartmentId(record.department)) return null;
  return { name: record.name as 'desk-open' | 'record-open' | 'record-export', department: record.department };
}

export function diagnosticsOn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(DIAGNOSTICS_KEY) === 'on';
  } catch {
    return false;
  }
}

export function setDiagnostics(on: boolean): void {
  window.localStorage.setItem(DIAGNOSTICS_KEY, on ? 'on' : 'off');
}
