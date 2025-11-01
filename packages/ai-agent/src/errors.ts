export type AgentErrorCode =
  | "rate_limit"
  | "opt_out"
  | "session_store"
  | "openai_error"
  | "validation_error";

export class AgentError extends Error {
  readonly code: AgentErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: AgentErrorCode,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class AgentRateLimitError extends AgentError {
  constructor(details?: Record<string, unknown>) {
    super("Rate limit exceeded", "rate_limit", 429, details);
  }
}

export class AgentOptOutError extends AgentError {
  constructor(details?: Record<string, unknown>) {
    super("AI assistant is disabled for this user", "opt_out", 403, details);
  }
}

export class AgentSessionError extends AgentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "session_store", 500, details);
  }
}

export class AgentOpenAIError extends AgentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "openai_error", 502, details);
  }
}

export class AgentValidationError extends AgentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "validation_error", 400, details);
  }
}
