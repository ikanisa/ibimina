import type { IngestionMetrics, MonitoringOptions, VectorStore } from "./types.js";

const STATUSES: Array<keyof IngestionMetrics["statusCounts"]> = [
  "pending",
  "processing",
  "completed",
  "failed",
];

export async function buildIngestionMetrics(
  store: VectorStore,
  options: MonitoringOptions = {}
): Promise<IngestionMetrics> {
  const jobs = await store.listJobs({ limit: options.limit ?? 100 });
  const statusCounts: Record<string, number> = {};

  let completed = 0;
  let failed = 0;
  let durationSum = 0;
  let durationCount = 0;
  let lastUpdatedAt: string | null = null;

  for (const status of STATUSES) {
    statusCounts[status] = 0;
  }

  for (const job of jobs) {
    statusCounts[job.status] = (statusCounts[job.status] ?? 0) + 1;

    if (job.status === "completed") {
      completed += 1;
    }

    if (job.status === "failed") {
      failed += 1;
    }

    if (job.finishedAt) {
      const started = new Date(job.startedAt).getTime();
      const finished = new Date(job.finishedAt).getTime();
      if (!Number.isNaN(started) && !Number.isNaN(finished) && finished >= started) {
        durationSum += finished - started;
        durationCount += 1;
      }
    }

    if (!lastUpdatedAt || job.startedAt > lastUpdatedAt) {
      lastUpdatedAt = job.startedAt;
    }
  }

  const totalJobs = jobs.length;
  const successRate = completed + failed > 0 ? completed / (completed + failed) : 1;
  const averageDurationMs = durationCount > 0 ? durationSum / durationCount : null;
  const recentFailures = jobs
    .filter((job) => job.status === "failed")
    .slice(0, options.includeFailures ?? 5)
    .map((job) => ({ ...job }));

  return {
    totalJobs,
    statusCounts: statusCounts as IngestionMetrics["statusCounts"],
    successRate,
    averageDurationMs,
    recentFailures,
    lastUpdatedAt,
  };
}
