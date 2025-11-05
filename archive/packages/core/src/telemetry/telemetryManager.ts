type Properties = Record<string, unknown>;

export interface SupabaseTelemetryClient {
  from(table: string): {
    insert(values: Record<string, unknown>): Promise<unknown>;
  };
}
export interface AnalyticsClient {
  capture(event: string, properties?: Properties): Promise<void> | void;
}

export interface ErrorTrackingClient {
  captureException(error: unknown, context?: Properties): void;
  captureMessage(message: string, context?: Properties): void;
}

export interface PerformanceMeasurement {
  readonly name: string;
  readonly durationMs: number;
  readonly deviceClass: "low" | "medium" | "high";
}

export interface FunnelStep {
  readonly id: string;
  readonly name: string;
  readonly success: boolean;
  readonly errorCode?: string;
  readonly durationMs: number;
}

export interface TelemetryOptions {
  readonly analytics: AnalyticsClient;
  readonly errors: ErrorTrackingClient;
  readonly supabase?: SupabaseTelemetryClient;
}

export class TelemetryManager {
  constructor(private readonly options: TelemetryOptions) {}

  async recordFunnel(flow: string, steps: readonly FunnelStep[]): Promise<void> {
    for (const step of steps) {
      await this.options.analytics.capture(`funnel:${flow}:${step.id}`, {
        name: step.name,
        success: step.success,
        errorCode: step.errorCode ?? null,
        durationMs: step.durationMs,
      });

      if (!step.success && step.errorCode) {
        this.options.errors.captureMessage(`Funnel ${flow} failed`, {
          step: step.id,
          errorCode: step.errorCode,
        });
      }
    }
    await this.insertSupabaseEvent("funnels", { flow, steps });
  }

  async recordPerformance(
    app: string,
    measurements: readonly PerformanceMeasurement[]
  ): Promise<void> {
    for (const measurement of measurements) {
      await this.options.analytics.capture(`perf:${app}:${measurement.name}`, {
        durationMs: measurement.durationMs,
        deviceClass: measurement.deviceClass,
      });
    }
    await this.insertSupabaseEvent("performance", { app, measurements });
  }

  async recordErrorBudget(service: string, burnRate: number): Promise<void> {
    await this.options.analytics.capture("error-budget", {
      service,
      burnRate,
    });

    if (burnRate > 1) {
      this.options.errors.captureMessage("Error budget burn rate exceeded", {
        service,
        burnRate,
      });
    }
    await this.insertSupabaseEvent("error_budget", { service, burnRate });
  }

  private async insertSupabaseEvent(table: string, payload: Properties): Promise<void> {
    if (!this.options.supabase) {
      return;
    }

    await this.options.supabase.from("telemetry_events").insert({
      table,
      payload,
      created_at: new Date().toISOString(),
    });
  }
}
