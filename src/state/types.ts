export type AuthUser = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
};

export type AuthCredentials = {
  phoneOrEmail: string;
  otpCode?: string;
  password?: string;
};

export type AuthState = {
  user: AuthUser | null;
  token?: string;
  status: "idle" | "loading" | "authenticated" | "error";
  error?: string;
  lastSyncedAt?: string;
};

export type PaymentRequest = {
  amount: number;
  destination: string;
  method: "wallet" | "card" | "bank";
  note?: string;
};

export type PaymentRecord = {
  id: string;
  amount: number;
  destination: string;
  method: PaymentRequest["method"];
  status: "pending" | "sent" | "failed";
  message?: string;
  createdAt: string;
  updatedAt: string;
  offline?: boolean;
};

export type PaymentQueueEntry = {
  localId: string;
  request: PaymentRequest;
  enqueuedAt: string;
  attempts: number;
  status: "queued" | "syncing" | "failed";
  nextRetryMessage?: string;
  lastError?: string;
};

export type PaymentsState = {
  queue: PaymentQueueEntry[];
  history: PaymentRecord[];
  isOnline: boolean;
  statusMessage?: string;
  lastSyncedAt?: string;
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  expiresAt?: string;
};

export type OffersState = {
  items: Offer[];
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
  lastUpdatedAt?: string;
};

export type AppState = {
  auth: AuthState;
  payments: PaymentsState;
  offers: OffersState;
};
