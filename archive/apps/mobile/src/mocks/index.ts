/**
 * Mock data loader
 * Provides fixtures for development and testing
 */

import fixtures from "./fixtures.json";

export type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
  locale: string;
  joinedAt: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  totalSavings: number;
  currency: string;
  meetingSchedule: string;
  joined: boolean;
  role: string | null;
};

export type Transaction = {
  id: string;
  type: "contribution" | "loan" | "withdrawal";
  amount: number;
  currency: string;
  date: string;
  groupId: string;
  groupName: string;
  status: "pending" | "completed" | "failed";
  method: "mobile_money" | "bank_transfer" | "cash";
};

export type Statement = {
  id: string;
  month: string;
  groupId: string;
  groupName: string;
  openingBalance: number;
  contributions: number;
  loans: number;
  withdrawals: number;
  closingBalance: number;
  currency: string;
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  type: "loan" | "bonus" | "promotion";
  validUntil: string;
  termsUrl: string;
  imageUrl: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  type: "payment_reminder" | "offer" | "announcement";
  read: boolean;
  createdAt: string;
};

/**
 * Mock API functions
 */
export const mockApi = {
  getUser: (): Promise<User> => {
    return Promise.resolve(fixtures.user as User);
  },

  getGroups: (): Promise<Group[]> => {
    return Promise.resolve(fixtures.groups as Group[]);
  },

  getTransactions: (): Promise<Transaction[]> => {
    return Promise.resolve(fixtures.transactions as Transaction[]);
  },

  getStatements: (): Promise<Statement[]> => {
    return Promise.resolve(fixtures.statements as Statement[]);
  },

  getOffers: (): Promise<Offer[]> => {
    return Promise.resolve(fixtures.offers as Offer[]);
  },

  getNotifications: (): Promise<Notification[]> => {
    return Promise.resolve(fixtures.notifications as Notification[]);
  },

  // Mutation mocks
  joinGroup: (groupId: string): Promise<void> => {
    console.log(`[Mock] Joining group ${groupId}`);
    return Promise.resolve();
  },

  makePayment: (amount: number, groupId: string): Promise<void> => {
    console.log(`[Mock] Making payment of ${amount} to group ${groupId}`);
    return Promise.resolve();
  },

  requestLoan: (amount: number, groupId: string): Promise<void> => {
    console.log(`[Mock] Requesting loan of ${amount} from group ${groupId}`);
    return Promise.resolve();
  },
};

export default mockApi;
