import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Validator<Args> = (input: unknown) => Args;

type Executor<Args, Result> = (args: Args) => Promise<Result>;

export interface ToolDefinition<Args, Result> {
  readonly name: string;
  readonly description: string;
  readonly validate: Validator<Args>;
  readonly execute: Executor<Args, Result>;
}

const packageRoot = fileURLToPath(new URL("../../..", import.meta.url));
const repoRoot = resolve(packageRoot, "..", "..");
const metricsCsvPath = resolve(packageRoot, "logs", "agentMetrics.csv");
const defaultSurveyPath = resolve(
  repoRoot,
  "docs",
  "operations",
  "surveys",
  "2025-10-agent-satisfaction.csv"
);
const followUpScheduleRelativePath = "docs/retros/review-schedule.json";
const followUpSchedulePath = resolve(repoRoot, followUpScheduleRelativePath);

interface _DateRangeArgs {
  startDate?: string;
  endDate?: string;
  filePath?: string;
}

interface MetricsArgs {
  startDate?: string;
  endDate?: string;
  filePath: string;
}

interface MetricsSummary {
  startDate: string | null;
  endDate: string | null;
  totalInteractions: number;
  resolutionRate: number;
  deflectionRate: number;
  escalationRate: number;
  averageHandleTimeSeconds: number;
  averageFirstResponseSeconds: number;
  averageCsat: number;
  peakEscalationDate: string | null;
  peakEscalationCount: number;
  handleTimeDeltaSeconds: number;
}

interface _SurveySummaryArgs {
  startDate?: string;
  endDate?: string;
  surveyPath?: string;
}

interface SurveyArgs {
  startDate?: string;
  endDate?: string;
  surveyPath: string;
}

interface SurveySummary {
  startDate: string | null;
  endDate: string | null;
  responses: number;
  weightedCsat: number;
  weightedCes: number;
  weightedNps: number;
  positiveComments: number;
  neutralComments: number;
  negativeComments: number;
  negativeCommentRate: number;
}

interface FollowUpArgs {
  reviewDate: string;
  owner: string;
  focusAreas: string[];
  channel?: string;
}

interface FollowUpConfirmation {
  reviewDate: string;
  owner: string;
  focusAreas: string[];
  channel: string;
  storagePath: string;
}

interface CsvRecord {
  [key: string]: string;
}

const ensureObject = (value: unknown, toolName: string): Record<string, unknown> => {
  if (!value || typeof value !== "object") {
    throw new Error(`${toolName} expects an object input.`);
  }
  return value as Record<string, unknown>;
};

const parseDate = (value: unknown, field: string): string | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string in YYYY-MM-DD format.`);
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new Error(`${field} must be a valid ISO date string.`);
  }
  return value;
};

const loadCsv = async (path: string): Promise<CsvRecord[]> => {
  const raw = await readFile(path, "utf-8");
  const lines = raw.trim().split(/\r?\n/);
  const headers = lines.shift();
  if (!headers) {
    return [];
  }
  const headerParts = headers.split(",").map((item) => item.trim());
  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const parts = line.split(",");
      const record: CsvRecord = {};
      headerParts.forEach((header, index) => {
        record[header] = (parts[index] ?? "").trim();
      });
      return record;
    });
};

const filterByDateRange = <T extends CsvRecord>(
  records: T[],
  startDate?: string,
  endDate?: string
): T[] => {
  return records.filter((record) => {
    const value = record.date;
    if (!value) {
      return false;
    }
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
      return false;
    }
    if (startDate && timestamp < Date.parse(startDate)) {
      return false;
    }
    if (endDate && timestamp > Date.parse(endDate)) {
      return false;
    }
    return true;
  });
};

const toNumber = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
};

const metricsSummaryTool: ToolDefinition<MetricsArgs, MetricsSummary> = {
  name: "agentMetricsSummary",
  description:
    "Summarise agent performance metrics (resolution, deflection, response speed) for an optional date range.",
  validate: (input) => {
    const value = ensureObject(input, "agentMetricsSummary");
    const startDate = parseDate(value.startDate, "startDate");
    const endDate = parseDate(value.endDate, "endDate");
    const filePath =
      typeof value.filePath === "string" && value.filePath.trim().length > 0
        ? resolve(packageRoot, value.filePath)
        : metricsCsvPath;
    return { startDate, endDate, filePath } satisfies MetricsArgs;
  },
  execute: async ({ startDate, endDate, filePath }) => {
    const records = await loadCsv(filePath);
    const scoped = filterByDateRange(records, startDate, endDate);
    if (scoped.length === 0) {
      return {
        startDate: startDate ?? null,
        endDate: endDate ?? null,
        totalInteractions: 0,
        resolutionRate: 0,
        deflectionRate: 0,
        escalationRate: 0,
        averageHandleTimeSeconds: 0,
        averageFirstResponseSeconds: 0,
        averageCsat: 0,
        peakEscalationDate: null,
        peakEscalationCount: 0,
        handleTimeDeltaSeconds: 0,
      } satisfies MetricsSummary;
    }
    const totals = scoped.reduce(
      (acc, record) => {
        acc.totalInteractions += toNumber(record.total_interactions);
        acc.resolved += toNumber(record.resolved);
        acc.deflected += toNumber(record.deflected);
        const escalations = toNumber(record.escalations);
        acc.escalations += escalations;
        acc.totalHandleTime += toNumber(record.avg_handle_time_seconds);
        acc.totalFirstResponse += toNumber(record.first_response_seconds);
        acc.totalCsat += toNumber(record.csat);
        if (escalations > acc.maxEscalations) {
          acc.maxEscalations = escalations;
          acc.peakDate = record.date ?? null;
        }
        return acc;
      },
      {
        totalInteractions: 0,
        resolved: 0,
        deflected: 0,
        escalations: 0,
        totalHandleTime: 0,
        totalFirstResponse: 0,
        totalCsat: 0,
        maxEscalations: 0,
        peakDate: null as string | null,
      }
    );
    const averageHandleTimeSeconds = totals.totalHandleTime / scoped.length;
    const averageFirstResponseSeconds = totals.totalFirstResponse / scoped.length;
    const averageCsat = totals.totalCsat / scoped.length;
    const resolutionRate =
      totals.totalInteractions === 0 ? 0 : totals.resolved / totals.totalInteractions;
    const deflectionRate =
      totals.totalInteractions === 0 ? 0 : totals.deflected / totals.totalInteractions;
    const escalationRate =
      totals.totalInteractions === 0 ? 0 : totals.escalations / totals.totalInteractions;
    const peakEscalationCount = totals.maxEscalations;
    const peakEscalationDate = totals.peakDate;
    const handleTimeDeltaSeconds = averageHandleTimeSeconds - 360;
    return {
      startDate: startDate ?? scoped[0].date ?? null,
      endDate: endDate ?? scoped[scoped.length - 1].date ?? null,
      totalInteractions: totals.totalInteractions,
      resolutionRate,
      deflectionRate,
      escalationRate,
      averageHandleTimeSeconds,
      averageFirstResponseSeconds,
      averageCsat,
      peakEscalationDate,
      peakEscalationCount,
      handleTimeDeltaSeconds,
    } satisfies MetricsSummary;
  },
};

const surveySummaryTool: ToolDefinition<SurveyArgs, SurveySummary> = {
  name: "agentSatisfactionSummary",
  description:
    "Aggregate CSAT, CES, and NPS results from the latest agent satisfaction surveys for an optional date range.",
  validate: (input) => {
    const value = ensureObject(input, "agentSatisfactionSummary");
    const startDate = parseDate(value.startDate, "startDate");
    const endDate = parseDate(value.endDate, "endDate");
    const surveyPath =
      typeof value.surveyPath === "string" && value.surveyPath.trim().length > 0
        ? resolve(repoRoot, value.surveyPath)
        : defaultSurveyPath;
    return { startDate, endDate, surveyPath } satisfies SurveyArgs;
  },
  execute: async ({ startDate, endDate, surveyPath }) => {
    const records = await loadCsv(surveyPath);
    const scoped = filterByDateRange(records, startDate, endDate);
    if (scoped.length === 0) {
      return {
        startDate: startDate ?? null,
        endDate: endDate ?? null,
        responses: 0,
        weightedCsat: 0,
        weightedCes: 0,
        weightedNps: 0,
        positiveComments: 0,
        neutralComments: 0,
        negativeComments: 0,
        negativeCommentRate: 0,
      } satisfies SurveySummary;
    }
    const aggregates = scoped.reduce(
      (acc, record) => {
        const responses = toNumber(record.responses);
        acc.responses += responses;
        acc.csat += toNumber(record.csat_avg) * responses;
        acc.ces += toNumber(record.ces_avg) * responses;
        acc.nps += toNumber(record.nps) * responses;
        acc.positives += toNumber(record.positive_comments);
        acc.neutrals += toNumber(record.neutral_comments);
        acc.negatives += toNumber(record.negative_comments);
        return acc;
      },
      { responses: 0, csat: 0, ces: 0, nps: 0, positives: 0, neutrals: 0, negatives: 0 }
    );
    const weightedCsat = aggregates.responses === 0 ? 0 : aggregates.csat / aggregates.responses;
    const weightedCes = aggregates.responses === 0 ? 0 : aggregates.ces / aggregates.responses;
    const weightedNps = aggregates.responses === 0 ? 0 : aggregates.nps / aggregates.responses;
    const negativeCommentRate =
      aggregates.responses === 0 ? 0 : aggregates.negatives / aggregates.responses;
    return {
      startDate: startDate ?? scoped[0].date ?? null,
      endDate: endDate ?? scoped[scoped.length - 1].date ?? null,
      responses: aggregates.responses,
      weightedCsat,
      weightedCes,
      weightedNps,
      positiveComments: aggregates.positives,
      neutralComments: aggregates.neutrals,
      negativeComments: aggregates.negatives,
      negativeCommentRate,
    } satisfies SurveySummary;
  },
};

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const followUpTool: ToolDefinition<FollowUpArgs, FollowUpConfirmation> = {
  name: "scheduleFollowUpReview",
  description:
    "Record a follow-up quality review with owner accountability and the focus areas that must be revisited.",
  validate: (input) => {
    const value = ensureObject(input, "scheduleFollowUpReview");
    const reviewDate = parseDate(value.reviewDate, "reviewDate");
    if (!reviewDate) {
      throw new Error("reviewDate is required.");
    }
    const ownerRaw = value.owner;
    if (typeof ownerRaw !== "string" || ownerRaw.trim().length === 0) {
      throw new Error("owner is required and must be a non-empty string.");
    }
    const focusAreasRaw = value.focusAreas;
    if (!Array.isArray(focusAreasRaw) || focusAreasRaw.length === 0) {
      throw new Error("focusAreas must be a non-empty array of strings.");
    }
    const focusAreas = focusAreasRaw.map((item) => {
      if (typeof item !== "string" || item.trim().length === 0) {
        throw new Error("focusAreas entries must be non-empty strings.");
      }
      return item.trim();
    });
    const channel =
      typeof value.channel === "string" && value.channel.trim().length > 0
        ? value.channel.trim()
        : "calendar";
    return { reviewDate, owner: ownerRaw.trim(), focusAreas, channel };
  },
  execute: async ({ reviewDate, owner, focusAreas, channel }) => {
    const resolvedChannel = channel ?? "calendar";
    const entry = { reviewDate, owner, focusAreas, channel: resolvedChannel };
    await mkdir(dirname(followUpSchedulePath), { recursive: true });
    let existing: FollowUpConfirmation[] = [];
    if (await pathExists(followUpSchedulePath)) {
      const current = await readFile(followUpSchedulePath, "utf-8");
      if (current.trim().length > 0) {
        try {
          existing = JSON.parse(current) as FollowUpConfirmation[];
        } catch {
          existing = [];
        }
      }
    }
    const storedEntry = {
      ...entry,
      storagePath: followUpScheduleRelativePath,
    } satisfies FollowUpConfirmation;
    existing.push(storedEntry);
    await writeFile(followUpSchedulePath, `${JSON.stringify(existing, null, 2)}\n`, "utf-8");
    return storedEntry;
  },
};

export const tools: ToolDefinition<unknown, unknown>[] = [
  metricsSummaryTool,
  surveySummaryTool,
  followUpTool,
];

export default tools;
