import { getState, setState, useAppSelector } from "./core";
import type { AppState, AuthCredentials, AuthState, AuthUser } from "./types";

const nowIso = () => new Date().toISOString();

export const authInitialState: AuthState = {
  user: null,
  token: undefined,
  status: "idle",
  error: undefined,
  lastSyncedAt: undefined,
};

const mergeAuthState = (partial: Partial<AuthState>) =>
  setState((current) => ({ ...current, auth: { ...current.auth, ...partial } }));

export const setAuthUser = (user: AuthUser, token?: string) => {
  mergeAuthState({ user, token, status: "authenticated", lastSyncedAt: nowIso() });
};

export const clearSession = () => {
  mergeAuthState({ ...authInitialState, status: "idle" });
};

export const setAuthError = (message: string) => {
  mergeAuthState({ status: "error", error: message });
};

const mockAuthenticate = async (
  credentials: AuthCredentials
): Promise<{ user: AuthUser; token: string }> => {
  const idFragment = credentials.phoneOrEmail.replace(/[^a-zA-Z0-9]/g, "");
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          user: {
            id: `user-${idFragment || "guest"}`,
            name: "Atlas Member",
            phone: credentials.phoneOrEmail,
          },
          token: `token-${Date.now()}`,
        }),
      300
    )
  );
};

export const authenticate = async (credentials: AuthCredentials) => {
  mergeAuthState({ status: "loading", error: undefined });

  try {
    const session = await mockAuthenticate(credentials);
    setAuthUser(session.user, session.token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign in.";
    setAuthError(message);
  }
};

export const selectAuthState = (state: AppState) => state.auth;
export const selectAuthUser = (state: AppState) => state.auth.user;
export const selectAuthStatus = (state: AppState) => state.auth.status;
export const selectAuthError = (state: AppState) => state.auth.error;

export const useAuthState = () => useAppSelector(selectAuthState);
export const useAuthUser = () => useAppSelector(selectAuthUser);
export const useAuthStatus = () => useAppSelector(selectAuthStatus);
export const useAuthError = () => useAppSelector(selectAuthError);

export const refreshAuthSession = async () => {
  const { auth } = getState();
  if (!auth.user) return;

  mergeAuthState({ status: "loading" });
  try {
    const session = await mockAuthenticate({ phoneOrEmail: auth.user.phone ?? auth.user.id });
    setAuthUser(session.user, session.token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session refresh failed.";
    mergeAuthState({ status: "error", error: message });
  }
};
