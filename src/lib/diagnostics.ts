import { TelemetryCollector } from '../telemetry/schema';

const collector = new TelemetryCollector({
  enabled: true,
  diagnosticMode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  samplingRate: 1,
  flushInterval: 0,
});

export function trace(
  component: string,
  type: 'interaction' | 'state' | 'error',
  payload: Record<string, unknown>
): void {
  collector.record({
    type,
    component,
    payload,
    severity: type === 'error' ? 'error' : 'info',
  });
  const events = collector.drain();
  if (events.length === 0 || typeof fetch === 'undefined') return;
  void fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ events }),
  }).catch(() => undefined);
}
