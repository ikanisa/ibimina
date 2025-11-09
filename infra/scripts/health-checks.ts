#!/usr/bin/env node
/**
 * Health check script for critical services in the SACCO+ platform.
 * This script validates the readiness of all services for production deployment.
 *
 * Usage:
 *   ts-node infra/scripts/health-checks.ts [--endpoint <url>]
 *
 * Example:
 *   ts-node infra/scripts/health-checks.ts --endpoint https://admin.sacco.rw
 */

interface HealthCheckResponse {
  ok: boolean;
  timestamp: string;
  version: string;
  checks: {
    database: {
      ok: boolean;
      latency_ms?: number;
      error?: string;
    };
    auth: {
      ok: boolean;
      error?: string;
    };
  };
}

interface ServiceHealthCheck {
  name: string;
  url: string;
  timeout: number;
}

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
};

class HealthChecker {
  private services: ServiceHealthCheck[] = [];

  constructor(private baseUrl: string) {
    this.services = [
      {
        name: "Admin Portal",
        url: `${baseUrl}/api/health`,
        timeout: 5000,
      },
    ];
  }

  async checkService(service: ServiceHealthCheck): Promise<{
    ok: boolean;
    response?: HealthCheckResponse;
    error?: string;
    duration: number;
  }> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), service.timeout);

      const response = await fetch(service.url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "SACCO-Health-Checker/1.0",
        },
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (!response.ok) {
        return {
          ok: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          duration,
        };
      }

      const data = (await response.json()) as HealthCheckResponse;

      return {
        ok: data.ok,
        response: data,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            ok: false,
            error: `Timeout after ${service.timeout}ms`,
            duration,
          };
        }
        return {
          ok: false,
          error: error.message,
          duration,
        };
      }
      return {
        ok: false,
        error: "Unknown error",
        duration,
      };
    }
  }

  private formatStatus(ok: boolean): string {
    return ok ? `${COLORS.green}✓ PASS${COLORS.reset}` : `${COLORS.red}✗ FAIL${COLORS.reset}`;
  }

  private printServiceResult(
    service: ServiceHealthCheck,
    result: Awaited<ReturnType<typeof this.checkService>>
  ): void {
    console.log(`\n${COLORS.blue}Service:${COLORS.reset} ${service.name} (${service.url})`);
    console.log(`${COLORS.blue}Status:${COLORS.reset} ${this.formatStatus(result.ok)}`);
    console.log(`${COLORS.blue}Duration:${COLORS.reset} ${result.duration}ms`);

    if (result.error) {
      console.log(`${COLORS.red}Error:${COLORS.reset} ${result.error}`);
      return;
    }

    if (result.response) {
      console.log(`${COLORS.blue}Version:${COLORS.reset} ${result.response.version}`);
      console.log(`${COLORS.blue}Timestamp:${COLORS.reset} ${result.response.timestamp}`);

      // Database check
      const db = result.response.checks.database;
      console.log(`  ${COLORS.yellow}Database:${COLORS.reset} ${this.formatStatus(db.ok)}`);
      if (db.latency_ms !== undefined) {
        console.log(`    Latency: ${db.latency_ms}ms`);
      }
      if (db.error) {
        console.log(`    ${COLORS.red}Error: ${db.error}${COLORS.reset}`);
      }

      // Auth check
      const auth = result.response.checks.auth;
      console.log(`  ${COLORS.yellow}Auth:${COLORS.reset} ${this.formatStatus(auth.ok)}`);
      if (auth.error) {
        console.log(`    ${COLORS.red}Error: ${auth.error}${COLORS.reset}`);
      }
    }
  }

  async runHealthChecks(): Promise<boolean> {
    console.log(`${COLORS.blue}===========================================`);
    console.log(`SACCO+ Platform Health Check`);
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`===========================================${COLORS.reset}\n`);

    let allPassed = true;

    for (const service of this.services) {
      const result = await this.checkService(service);
      this.printServiceResult(service, result);

      if (!result.ok) {
        allPassed = false;
      }
    }

    console.log(`\n${COLORS.blue}===========================================${COLORS.reset}`);
    if (allPassed) {
      console.log(`${COLORS.green}✓ All health checks passed${COLORS.reset}`);
      return true;
    } else {
      console.log(`${COLORS.red}✗ Some health checks failed${COLORS.reset}`);
      return false;
    }
  }
}

// Parse command line arguments
function parseArgs(): { endpoint: string } {
  const args = process.argv.slice(2);
  let endpoint = process.env.HEALTH_CHECK_ENDPOINT || "http://localhost:3100";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--endpoint" && args[i + 1]) {
      endpoint = args[i + 1];
      i++;
    }
  }

  return { endpoint };
}

// Main execution
async function main() {
  try {
    const { endpoint } = parseArgs();
    const checker = new HealthChecker(endpoint);
    const success = await checker.runHealthChecks();

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(
      `${COLORS.red}Fatal error:${COLORS.reset}`,
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// Run as main script
main();

export { HealthChecker };
