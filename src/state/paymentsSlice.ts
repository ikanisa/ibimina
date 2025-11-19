import { getState, setState, useAppSelector } from "./core";
import type {
  AppState,
  PaymentQueueEntry,
  PaymentRecord,
  PaymentRequest,
  PaymentsState,
} from "./types";

const nowIso = () => new Date().toISOString();
const MAX_RETRY_ATTEMPTS = 3;

const createLocalId = () => `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const paymentsInitialState: PaymentsState = {
  queue: [],
  history: [],
  isOnline: true,
  statusMessage: "Ready to send payments.",
  lastSyncedAt: undefined,
};

const mergePaymentState = (partial: Partial<PaymentsState>) =>
  setState((current) => ({ ...current, payments: { ...current.payments, ...partial } }));

const setQueue = (queue: PaymentQueueEntry[]) =>
  setState((current) => ({ ...current, payments: { ...current.payments, queue } }));

const setHistory = (history: PaymentRecord[]) =>
  setState((current) => ({ ...current, payments: { ...current.payments, history } }));

const buildRetryMessage = (attempts: number) => {
  if (attempts === 0) {
    return "Queued offline. We'll retry as soon as you're back online.";
  }

  const remaining = MAX_RETRY_ATTEMPTS - attempts;
  return remaining > 0
    ? `Retry scheduled. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
    : "Reached retry limit. Review and resend when connectivity stabilises.";
};

const simulatePaymentPush = async (request: PaymentRequest) => {
  if (request.amount <= 0) {
    throw new Error("Amounts must be greater than zero.");
  }

  return new Promise<PaymentRecord>((resolve) =>
    setTimeout(
      () =>
        resolve({
          id: `pay-${Date.now()}`,
          amount: request.amount,
          destination: request.destination,
          method: request.method,
          status: "sent",
          message: "Payment sent successfully.",
          createdAt: nowIso(),
          updatedAt: nowIso(),
          offline: false,
        }),
      350
    )
  );
};

export const setConnectivity = (isOnline: boolean) => {
  mergePaymentState({
    isOnline,
    statusMessage: isOnline
      ? "Back online. We'll sync any queued payments now."
      : "Offline mode. Payments will queue until connectivity returns.",
  });

  if (isOnline) {
    void syncQueuedPayments();
  }
};

export const enqueuePayment = (request: PaymentRequest, opts?: { forceOffline?: boolean }) => {
  const { payments } = getState();
  const shouldQueue = opts?.forceOffline || !payments.isOnline;
  const localId = createLocalId();

  if (shouldQueue) {
    const queuedEntry: PaymentQueueEntry = {
      localId,
      request,
      enqueuedAt: nowIso(),
      attempts: 0,
      status: "queued",
      nextRetryMessage: buildRetryMessage(0),
    };

    setQueue([...payments.queue, queuedEntry]);
    mergePaymentState({ statusMessage: "Saved offline and queued for sync." });
    return localId;
  }

  const pending: PaymentRecord = {
    id: localId,
    amount: request.amount,
    destination: request.destination,
    method: request.method,
    status: "pending",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    message: "Sending now...",
    offline: false,
  };

  setHistory([pending, ...payments.history]);
  void syncQueuedPayments();

  return localId;
};

export const syncQueuedPayments = async (
  paymentSender: (request: PaymentRequest) => Promise<PaymentRecord> = simulatePaymentPush
) => {
  const { payments } = getState();
  if (!payments.isOnline) return;

  let nextQueue = [...payments.queue];
  let nextHistory = [...payments.history];

  for (const entry of nextQueue) {
    if (entry.attempts >= MAX_RETRY_ATTEMPTS) continue;

    const updatedEntry: PaymentQueueEntry = {
      ...entry,
      status: "syncing",
      attempts: entry.attempts + 1,
      nextRetryMessage: "Syncing payment now...",
    };

    nextQueue = nextQueue.map((item) => (item.localId === entry.localId ? updatedEntry : item));
    setQueue(nextQueue);

    try {
      const record = await paymentSender(entry.request);
      nextHistory = [
        {
          ...record,
          offline: true,
          createdAt: entry.enqueuedAt,
          updatedAt: nowIso(),
          message: record.message ?? "Synced successfully.",
        },
        ...nextHistory,
      ];

      nextQueue = nextQueue.filter((item) => item.localId !== entry.localId);
      setQueue(nextQueue);
      setHistory(nextHistory);
      mergePaymentState({
        statusMessage: "Payment synced successfully.",
        lastSyncedAt: nowIso(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Payment could not be synced. Please retry.";

      nextQueue = nextQueue.map((item) =>
        item.localId === entry.localId
          ? {
              ...item,
              status: item.attempts + 1 >= MAX_RETRY_ATTEMPTS ? "failed" : "queued",
              attempts: item.attempts + 1,
              lastError: message,
              nextRetryMessage: buildRetryMessage(item.attempts + 1),
            }
          : item
      );

      setQueue(nextQueue);
      mergePaymentState({ statusMessage: message });
    }
  }
};

export const selectPaymentsState = (state: AppState) => state.payments;
export const selectPaymentQueue = (state: AppState) => state.payments.queue;
export const selectPaymentHistory = (state: AppState) => state.payments.history;
export const selectPaymentStatusMessage = (state: AppState) => state.payments.statusMessage;
export const selectConnectivity = (state: AppState) => state.payments.isOnline;

export const usePaymentsState = () => useAppSelector(selectPaymentsState);
export const usePaymentQueue = () => useAppSelector(selectPaymentQueue);
export const usePaymentHistory = () => useAppSelector(selectPaymentHistory);
export const usePaymentStatusMessage = () => useAppSelector(selectPaymentStatusMessage);
export const useConnectivity = () => useAppSelector(selectConnectivity);
