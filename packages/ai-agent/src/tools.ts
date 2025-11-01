import type { ToolRegistry } from "./types.js";

const members = new Map<string, { name: string; plan: string; balance: number }>([
  ["MEM-1001", { name: "Anesu Chuma", plan: "Premium", balance: 1520.5 }],
  ["MEM-2048", { name: "Grace Muriuki", plan: "Standard", balance: 342.75 }],
]);

const transactions = new Map<
  string,
  { id: string; status: "pending" | "completed" | "failed"; amount: number; memberId: string }
>([
  ["TX-9081", { id: "TX-9081", status: "completed", amount: 120, memberId: "MEM-1001" }],
  ["TX-5092", { id: "TX-5092", status: "pending", amount: 87.5, memberId: "MEM-2048" }],
]);

const docs = new Map<string, string>([
  [
    "loan",
    "Loan repayments are processed every Friday. Members can reschedule via the mobile app under Billing > Loan Options.",
  ],
  [
    "card",
    "To activate your SACCO card, visit Settings > Cards. Activation takes less than 2 minutes and requires your PIN.",
  ],
  [
    "groups",
    "Group admins can add members from the dashboard: Navigate to Groups > Manage > Invite Members.",
  ],
]);

async function lookupMember(membershipId: string): Promise<string> {
  const member = members.get(membershipId.toUpperCase());
  if (!member) {
    return `No member found with ID ${membershipId}.`;
  }

  return `${member.name} is on the ${member.plan} plan with a balance of ${member.balance.toFixed(2)} USD.`;
}

async function lookupTransaction(transactionId: string): Promise<string> {
  const transaction = transactions.get(transactionId.toUpperCase());
  if (!transaction) {
    return `Transaction ${transactionId} was not found.`;
  }

  const member = members.get(transaction.memberId);
  const memberName = member ? member.name : "Unknown member";

  return `Transaction ${transaction.id} for ${memberName} is ${transaction.status} and totals ${transaction.amount.toFixed(
    2
  )} USD.`;
}

async function getPlatformDoc(topic: string): Promise<string> {
  const normalized = topic.toLowerCase();
  if (docs.has(normalized)) {
    return docs.get(normalized)!;
  }

  const entry = Array.from(docs.entries()).find(([key]) => normalized.includes(key));
  if (entry) {
    return entry[1];
  }

  return "No documentation snippet was found for that topic. Please try another keyword.";
}

async function systemHealth(): Promise<string> {
  return "All systems operational. No incidents reported in the last 24 hours.";
}

export function createDefaultTools(): ToolRegistry {
  return { lookupMember, lookupTransaction, getPlatformDoc, systemHealth };
}
