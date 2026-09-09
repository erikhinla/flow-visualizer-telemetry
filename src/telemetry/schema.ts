/**
 * Privacy boundary for P0 diagnostic telemetry.
 * Questionnaire answers, free text, user identifiers, IP addresses, and user
 * agents are intentionally absent from every payload type.
 */

export type VisualizerStage = "intro" | "survey" | "report" | "blueprint";

export type DiagnosticPayload =
  | { kind: "stage-change"; from: VisualizerStage; to: VisualizerStage }
  | { kind: "control"; control: "answer" | "back" | "restart" | "department" | "flow-scenario" | "generate" }
  | { kind: "render-duration"; stage: VisualizerStage; durationMs: number }
  | { kind: "ui-error"; code: "invalid-selection" | "scenario-unavailable" | "render-failed" };

export interface DiagnosticEvent {
  id: string;
  timestampMs: number;
  schemaVersion: 1;
  component: "flow-visualizer";
  severity: "info" | "warn" | "error";
  payload: DiagnosticPayload;
}

export interface TelemetrySink {
  send(events: readonly DiagnosticEvent[]): Promise<void>;
}

export interface TelemetryConfig {
  enabled: boolean;
  diagnosticMode: "development" | "staging" | "production";
  samplingRate: number;
  flushIntervalMs: number;
  maxQueueSize: number;
  sink: TelemetrySink;
}

export interface TelemetryDependencies {
  now?: () => number;
  random?: () => number;
  id?: () => string;
  setTimer?: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
}

export class TelemetryCollector {
  private queue: DiagnosticEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushing: Promise<void> | null = null;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly id: () => string;
  private readonly setTimer: NonNullable<TelemetryDependencies["setTimer"]>;
  private readonly clearTimer: NonNullable<TelemetryDependencies["clearTimer"]>;

  constructor(
    private readonly config: TelemetryConfig,
    dependencies: TelemetryDependencies = {},
  ) {
    if (config.samplingRate < 0 || config.samplingRate > 1) throw new Error("samplingRate must be between 0 and 1.");
    if (config.flushIntervalMs <= 0) throw new Error("flushIntervalMs must be greater than zero.");
    if (config.maxQueueSize <= 0) throw new Error("maxQueueSize must be greater than zero.");

    this.now = dependencies.now ?? Date.now;
    this.random = dependencies.random ?? Math.random;
    this.id = dependencies.id ?? (() => globalThis.crypto.randomUUID());
    this.setTimer = dependencies.setTimer ?? setTimeout;
    this.clearTimer = dependencies.clearTimer ?? clearTimeout;
  }

  record(event: Omit<DiagnosticEvent, "id" | "timestampMs" | "schemaVersion" | "component">): boolean {
    if (!this.config.enabled || this.random() >= this.config.samplingRate) return false;

    this.queue.push({
      ...event,
      id: this.id(),
      timestampMs: this.now(),
      schemaVersion: 1,
      component: "flow-visualizer",
    });

    if (this.queue.length >= this.config.maxQueueSize) {
      void this.flush();
    } else {
      this.scheduleFlush();
    }
    return true;
  }

  queuedCount(): number {
    return this.queue.length;
  }

  async flush(): Promise<void> {
    if (this.flushing) return this.flushing;
    if (this.timer) {
      this.clearTimer(this.timer);
      this.timer = null;
    }
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.queue.length);
    this.flushing = this.config.sink.send(batch).catch((error: unknown) => {
      this.queue.unshift(...batch);
      throw error;
    }).finally(() => {
      this.flushing = null;
      if (this.queue.length > 0) this.scheduleFlush();
    });
    return this.flushing;
  }

  async dispose(): Promise<void> {
    if (this.timer) {
      this.clearTimer(this.timer);
      this.timer = null;
    }
    await this.flush();
  }

  private scheduleFlush(): void {
    if (this.timer || this.queue.length === 0) return;
    this.timer = this.setTimer(() => {
      this.timer = null;
      void this.flush();
    }, this.config.flushIntervalMs);
  }
}
