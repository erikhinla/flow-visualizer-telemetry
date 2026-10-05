import { diagnosticsOn, type TraceEvent } from './telemetry';

/** Sends one event only after the visitor has opted in. Numbers and inputs are never sent. */
export function trace(event: TraceEvent): void {
  if (typeof fetch === 'undefined') return;
  if (!diagnosticsOn()) return;
  void fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ events: [event] }),
  }).catch(() => undefined);
}
