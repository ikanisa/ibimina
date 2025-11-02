/**
 * AI Agent Guardrails
 *
 * Security and safety checks to prevent cross-tenant data leaks,
 * sensitive operations, and other security issues.
 */

export interface GuardrailDecision {
  outcome: "allow" | "refuse" | "escalate";
  message?: string;
}

const CROSS_TENANT_PATTERNS: RegExp[] = [
  /cross[-\s]?tenant/i,
  /other\s+(?:sacco|tenant|cooperative)/i,
  /outside\s+(?:our\s+)?tenant/i,
  /data\s+for\s+.*\s+tenant/i,
  /different\s+branch\s+member/i,
];

const SENSITIVE_PATTERNS: RegExp[] = [
  /delete\s+all\s+transactions?/i,
  /override\s+(?:loan|limit)/i,
  /transfer\s+funds/i,
  /reset\s+(?:mfa|2fa|biometric)/i,
  /disable\s+.*security/i,
];

function normalise(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Evaluates user input against security guardrails
 * @param content The user's message content
 * @returns GuardrailDecision indicating whether to allow, refuse, or escalate
 */
export function evaluateGuardrails(content: string): GuardrailDecision {
  const normalised = normalise(content);

  // Check for cross-tenant access attempts
  for (const pattern of CROSS_TENANT_PATTERNS) {
    if (pattern.test(normalised)) {
      return {
        outcome: "refuse",
        message:
          "I'm sorry, but I can't provide information about members from another SACCO tenant. Please work through the official escalation channel.",
      };
    }
  }

  // Check for sensitive operations
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(normalised)) {
      return {
        outcome: "escalate",
        message:
          "This is a sensitive action that requires supervisor approval. I've flagged it for the operations lead to review.",
      };
    }
  }

  return {
    outcome: "allow",
  };
}
