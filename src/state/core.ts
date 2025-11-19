import { useSyncExternalStore } from "react";
import type { AppState } from "./types";

type Selector<T> = (state: AppState) => T;

type Listener = () => void;

let state: AppState | null = null;
const listeners = new Set<Listener>();

const ensureState = (): AppState => {
  if (!state) {
    throw new Error("App state accessed before being configured.");
  }

  return state;
};

export const configureState = (initialState: AppState) => {
  if (state) return;
  state = initialState;
};

export const getState = (): AppState => ensureState();

export const setState = (updater: (current: AppState) => AppState) => {
  const nextState = updater(ensureState());
  state = nextState;
  listeners.forEach((listener) => listener());
};

export const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useAppSelector = <T>(selector: Selector<T>): T =>
  useSyncExternalStore(subscribe, () => selector(ensureState()));
