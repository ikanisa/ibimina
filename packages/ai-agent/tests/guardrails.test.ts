import { describe, expect, it } from "vitest";
import { evaluateGuardrails } from "../src/guardrails";

describe("AI Agent Guardrails", () => {
  describe("Cross-tenant access", () => {
    it("should refuse cross-tenant data access requests", () => {
      const result = evaluateGuardrails("Show me data for other SACCO tenants");
      expect(result.outcome).toBe("refuse");
      expect(result.message).toContain("another SACCO tenant");
    });

    it("should refuse requests about different branches", () => {
      const result = evaluateGuardrails("Can I see different branch member info?");
      expect(result.outcome).toBe("refuse");
    });

    it("should refuse cross-tenant pattern variations", () => {
      const tests = [
        "cross-tenant access",
        "data outside our tenant",
        "other cooperative information",
      ];

      for (const test of tests) {
        const result = evaluateGuardrails(test);
        expect(result.outcome).toBe("refuse");
      }
    });
  });

  describe("Sensitive operations", () => {
    it("should escalate sensitive deletion requests", () => {
      const result = evaluateGuardrails("Delete all transactions");
      expect(result.outcome).toBe("escalate");
      expect(result.message).toContain("supervisor approval");
    });

    it("should escalate security-related operations", () => {
      const tests = [
        "override loan limit",
        "transfer funds to external account",
        "reset MFA for all users",
        "disable security features",
      ];

      for (const test of tests) {
        const result = evaluateGuardrails(test);
        expect(result.outcome).toBe("escalate");
      }
    });
  });

  describe("Normal operations", () => {
    it("should allow normal information requests", () => {
      const result = evaluateGuardrails("What is the loan application status?");
      expect(result.outcome).toBe("allow");
      expect(result.message).toBeUndefined();
    });

    it("should allow common support questions", () => {
      const tests = [
        "How do I create a ticket?",
        "Show member balance",
        "Generate monthly report",
        "Check transaction history",
      ];

      for (const test of tests) {
        const result = evaluateGuardrails(test);
        expect(result.outcome).toBe("allow");
      }
    });
  });
});
