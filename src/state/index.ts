import { configureState, getState, setState, useAppSelector } from "./core";
import {
  authInitialState,
  authenticate,
  clearSession,
  refreshAuthSession,
  selectAuthError,
  selectAuthState,
  selectAuthStatus,
  selectAuthUser,
  setAuthError,
  setAuthUser,
  useAuthError,
  useAuthState,
  useAuthStatus,
  useAuthUser,
} from "./authSlice";
import {
  enqueuePayment,
  paymentsInitialState,
  selectConnectivity,
  selectPaymentHistory,
  selectPaymentsState,
  selectPaymentQueue,
  selectPaymentStatusMessage,
  setConnectivity,
  syncQueuedPayments,
  useConnectivity,
  usePaymentHistory,
  usePaymentsState,
  usePaymentQueue,
  usePaymentStatusMessage,
} from "./paymentsSlice";
import {
  clearOffers,
  offersInitialState,
  refreshOffers,
  selectOffers,
  selectOffersError,
  selectOffersStatus,
  selectOffersTimestamp,
  useOffers,
  useOffersError,
  useOffersStatus,
  useOffersTimestamp,
} from "./offersSlice";
import type { AppState } from "./types";

const initialState: AppState = {
  auth: authInitialState,
  payments: paymentsInitialState,
  offers: offersInitialState,
};

configureState(initialState);

export { configureState, getState, setState, useAppSelector };

export {
  authenticate,
  clearSession,
  refreshAuthSession,
  selectAuthError,
  selectAuthState,
  selectAuthStatus,
  selectAuthUser,
  setAuthError,
  setAuthUser,
  useAuthError,
  useAuthState,
  useAuthStatus,
  useAuthUser,
};

export {
  enqueuePayment,
  paymentsInitialState,
  selectConnectivity,
  selectPaymentHistory,
  selectPaymentsState,
  selectPaymentQueue,
  selectPaymentStatusMessage,
  setConnectivity,
  syncQueuedPayments,
  useConnectivity,
  usePaymentHistory,
  usePaymentsState,
  usePaymentQueue,
  usePaymentStatusMessage,
};

export {
  clearOffers,
  offersInitialState,
  refreshOffers,
  selectOffers,
  selectOffersError,
  selectOffersStatus,
  selectOffersTimestamp,
  useOffers,
  useOffersError,
  useOffersStatus,
  useOffersTimestamp,
};

export type * from "./types";
