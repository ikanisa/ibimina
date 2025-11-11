import type { StatementEntry } from "@/components/statements/statements-table";

export interface MockGroup {
  id: string;
  name: string;
  totalSavings: number;
  memberCount: number;
  lastContribution: string;
  saccoName: string;
  merchantCode: string;
  reference: string;
  defaultContribution: number;
}

export const mockGroups: MockGroup[] = [
  {
    id: "group-1",
    name: "Kigali Business Group",
    totalSavings: 250_000,
    memberCount: 12,
    lastContribution: "2025-10-25",
    saccoName: "Gasabo SACCO",
    merchantCode: "123456",
    reference: "NYA.GAS.KBG.001",
    defaultContribution: 20_000,
  },
  {
    id: "group-2",
    name: "Farmers Cooperative",
    totalSavings: 180_000,
    memberCount: 8,
    lastContribution: "2025-10-20",
    saccoName: "Kicukiro SACCO",
    merchantCode: "789012",
    reference: "NYA.KIC.FRM.002",
    defaultContribution: 15_000,
  },
];

export const mockStatements: StatementEntry[] = [
  {
    id: "statement-1",
    date: "2025-10-25T10:30:00Z",
    amount: 20_000,
    txnId: "MTN12345",
    status: "CONFIRMED",
    groupName: "Kigali Business Group",
    reference: "NYA.GAS.KBG.001",
  },
  {
    id: "statement-2",
    date: "2025-10-20T14:15:00Z",
    amount: 15_000,
    txnId: "MTN67890",
    status: "CONFIRMED",
    groupName: "Farmers Cooperative",
    reference: "NYA.KIC.FRM.002",
  },
  {
    id: "statement-3",
    date: "2025-10-28T09:00:00Z",
    amount: 25_000,
    txnId: "PENDING",
    status: "PENDING",
    groupName: "Kigali Business Group",
    reference: "NYA.GAS.KBG.001",
  },
  {
    id: "statement-4",
    date: "2025-10-15T11:45:00Z",
    amount: 18_000,
    txnId: "MTN11223",
    status: "CONFIRMED",
    groupName: "Farmers Cooperative",
    reference: "NYA.KIC.FRM.002",
  },
  {
    id: "statement-5",
    date: "2025-10-10T16:20:00Z",
    amount: 20_000,
    txnId: "MTN44556",
    status: "CONFIRMED",
    groupName: "Kigali Business Group",
    reference: "NYA.GAS.KBG.001",
  },
  {
    id: "statement-6",
    date: "2025-09-28T13:30:00Z",
    amount: 15_000,
    txnId: "MTN77889",
    status: "CONFIRMED",
    groupName: "Farmers Cooperative",
    reference: "NYA.KIC.FRM.002",
  },
  {
    id: "statement-7",
    date: "2025-09-20T10:00:00Z",
    amount: 20_000,
    txnId: "MTN99001",
    status: "CONFIRMED",
    groupName: "Kigali Business Group",
    reference: "NYA.GAS.KBG.001",
  },
];

export function getGroupById(id: string): MockGroup | undefined {
  return mockGroups.find((group) => group.id === id);
}
