import { logError, logInfo, logWarn, updateLogContext } from "@/lib/observability/logger";

type LogContextInput = Parameters<typeof updateLogContext>[0];

export const withAuthLogContext = (context: LogContextInput) => {
  updateLogContext(context);
};

export const authLog = {
  info: (event: string, payload?: Record<string, unknown>) => logInfo(event, payload),
  warn: (event: string, payload?: Record<string, unknown>) => logWarn(event, payload),
  error: (event: string, payload?: Record<string, unknown>) => logError(event, payload),
};
