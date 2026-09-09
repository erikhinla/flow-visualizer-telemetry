import { describe, expect, it, vi } from "vitest";
import { TelemetryCollector, type TelemetryConfig } from "./schema";

function config(overrides: Partial<TelemetryConfig> = {}): TelemetryConfig {
  return {
    enabled: true,
    diagnosticMode: "development",
    samplingRate: 1,
    flushIntervalMs: 1_000,
    maxQueueSize: 2,
    sink: { send: vi.fn().mockResolvedValue(undefined) },
    ...overrides,
  };
}

const event = { severity: "info" as const, payload: { kind: "control" as const, control: "answer" as const } };

describe("privacy-bounded telemetry collector", () => {
  it("does not queue when disabled or sampled out", () => {
    const disabled = new TelemetryCollector(config({ enabled: false }));
    const sampledOut = new TelemetryCollector(config({ samplingRate: 0 }));
    expect(disabled.record(event)).toBe(false);
    expect(sampledOut.record(event)).toBe(false);
    expect(disabled.queuedCount()).toBe(0);
    expect(sampledOut.queuedCount()).toBe(0);
  });

  it("flushes at the queue threshold", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const collector = new TelemetryCollector(config({ sink: { send } }), { now: () => 12, random: () => 0, id: () => "event-id" });
    collector.record(event);
    collector.record(event);
    await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
    expect(send.mock.calls[0]?.[0]).toHaveLength(2);
    expect(send.mock.calls[0]?.[0][0]).toMatchObject({ id: "event-id", timestampMs: 12, component: "flow-visualizer" });
  });

  it("flushes on the configured interval", async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue(undefined);
    const collector = new TelemetryCollector(config({ sink: { send }, maxQueueSize: 10 }));
    collector.record(event);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(send).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("retains a batch when the sink fails", async () => {
    const collector = new TelemetryCollector(config({ sink: { send: vi.fn().mockRejectedValue(new Error("offline")) }, maxQueueSize: 10 }));
    collector.record(event);
    await expect(collector.flush()).rejects.toThrow("offline");
    expect(collector.queuedCount()).toBe(1);
  });
});
