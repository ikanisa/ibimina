import { setState, useAppSelector } from "./core";
import type { AppState, Offer, OffersState } from "./types";

const nowIso = () => new Date().toISOString();

export const offersInitialState: OffersState = {
  items: [],
  status: "idle",
  error: undefined,
  lastUpdatedAt: undefined,
};

const mergeOffersState = (partial: Partial<OffersState>) =>
  setState((current) => ({ ...current, offers: { ...current.offers, ...partial } }));

const seedOffers = (): Offer[] => [
  {
    id: "offer-boost",
    title: "Savings boost",
    description: "Earn 2% bonus on group savings synced this week.",
    expiresAt: nowIso(),
  },
  {
    id: "offer-fee-waiver",
    title: "Fee waiver",
    description: "Send your next two payments with zero fees.",
  },
];

export const refreshOffers = async () => {
  mergeOffersState({ status: "loading", error: undefined });

  try {
    const items = await new Promise<Offer[]>((resolve) =>
      setTimeout(() => resolve(seedOffers()), 250)
    );
    mergeOffersState({ items, status: "ready", lastUpdatedAt: nowIso() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Offers are unavailable right now. Please retry.";
    mergeOffersState({ status: "error", error: message });
  }
};

export const clearOffers = () => mergeOffersState({ items: [], status: "idle", error: undefined });

export const selectOffers = (state: AppState) => state.offers.items;
export const selectOffersStatus = (state: AppState) => state.offers.status;
export const selectOffersError = (state: AppState) => state.offers.error;
export const selectOffersTimestamp = (state: AppState) => state.offers.lastUpdatedAt;

export const useOffers = () => useAppSelector(selectOffers);
export const useOffersStatus = () => useAppSelector(selectOffersStatus);
export const useOffersError = () => useAppSelector(selectOffersError);
export const useOffersTimestamp = () => useAppSelector(selectOffersTimestamp);
