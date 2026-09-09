/**
 * Telemetry Schema for FLOW Blueprint Visualizer
 * 
 * Diagnostic rules and instrumentation points derived from VISUALIZER_MASTER.md
 * Reference: https://github.com/erikhinla/flow-visualizer-telemetry/blob/main/SETUP_RECORD.md
 */

export interface DiagnosticEvent {
  id: string;
  timestamp: number;
  type: 'render' | 'interaction' | 'error' | 'performance' | 'state';
  component: string;
  payload: Record<string, unknown>;
  severity: 'info' | 'warn' | 'error';
}

export interface TelemetryConfig {
  enabled: boolean;
  diagnosticMode: 'development' | 'staging' | 'production';
  samplingRate: number; // 0-1
  flushInterval: number; // ms
}

export class TelemetryCollector {
  private queue: DiagnosticEvent[] = [];
  private config: TelemetryConfig;

  constructor(config: TelemetryConfig) {
    this.config = config;
  }

  record(event: Omit<DiagnosticEvent, 'id' | 'timestamp'>): void {
    if (!this.config.enabled) return;

    const fullEvent: DiagnosticEvent = {
      ...event,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.queue.push(fullEvent);

    if (this.shouldFlush()) {
      this.flush();
    }
  }

  private shouldFlush(): boolean {
    // Placeholder: implement intelligent flush logic
    return this.queue.length > 100;
  }

  private flush(): void {
    // Placeholder: send to telemetry backend (Cloud Logging, Firestore, etc.)
    if (this.config.diagnosticMode === 'development') {
      console.log('[TELEMETRY]', this.queue);
    }
    this.queue = [];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
