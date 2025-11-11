/**
 * Web-based implementation of the PIN authentication bridge.
 *
 * The original version of this module depended on Capacitor native plugins.
 * To keep the PWA experience functional after removing the Capacitor stack we
 * emulate the behaviour with browser storage. The API surface remains the same
 * so that existing React components can continue to call the helper methods
 * without code changes.
 */

export interface PinAuthPlugin {
  hasPin(): Promise<{ hasPin: boolean }>;
  setPin(options: { pin: string }): Promise<{ success: boolean }>;
  verifyPin(options: { pin: string }): Promise<PinVerifyResult>;
  deletePin(): Promise<{ success: boolean }>;
  changePin(options: { oldPin: string; newPin: string }): Promise<{ success: boolean }>;
  getLockStatus(): Promise<LockStatus>;
}

export interface PinVerifyResult {
  success: boolean;
  valid: boolean;
  attemptsRemaining?: number;
}

export interface LockStatus {
  isLocked: boolean;
  remainingSeconds: number;
  failCount: number;
  attemptsRemaining: number;
}

const STORAGE_KEY = "ibimina.pinAuth";
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

type StoredState = {
  pinHash?: string;
  failCount: number;
  lockUntil?: number;
};

const defaultState: StoredState = {
  failCount: 0,
};

const memoryState: StoredState = { ...defaultState };

const isBrowser = () => typeof window !== "undefined";

function readState(): StoredState {
  if (!isBrowser()) {
    return memoryState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultState };
    }

    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      pinHash: typeof parsed.pinHash === "string" ? parsed.pinHash : undefined,
      failCount: typeof parsed.failCount === "number" ? parsed.failCount : 0,
      lockUntil: typeof parsed.lockUntil === "number" ? parsed.lockUntil : undefined,
    };
  } catch (error) {
    console.warn("Failed to read PIN auth state, resetting", error);
    return { ...defaultState };
  }
}

function writeState(next: StoredState): void {
  if (!isBrowser()) {
    Object.assign(memoryState, next);
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Failed to persist PIN auth state", error);
  }
}

async function hashPin(pin: string): Promise<string> {
  if (typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined") {
    try {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
      return Array.from(new Uint8Array(digest))
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
    } catch (error) {
      console.warn("Falling back to plain PIN storage", error);
    }
  }

  return pin;
}

function getLockStatusFromState(state: StoredState): LockStatus {
  const now = Date.now();
  if (state.lockUntil && state.lockUntil <= now) {
    state.lockUntil = undefined;
    state.failCount = 0;
    writeState(state);
  }

  const isLocked = typeof state.lockUntil === "number" && state.lockUntil > now;
  const remainingSeconds = isLocked ? Math.ceil((state.lockUntil! - now) / 1000) : 0;

  return {
    isLocked,
    remainingSeconds,
    failCount: state.failCount,
    attemptsRemaining: Math.max(MAX_ATTEMPTS - state.failCount, 0),
  };
}

function lockAccount(state: StoredState): void {
  state.lockUntil = Date.now() + LOCK_DURATION_MS;
  writeState(state);
}

export function isPinAuthAvailable(): boolean {
  return isBrowser();
}

export function validatePinFormat(pin: string): { valid: boolean; error?: string } {
  if (!pin) {
    return { valid: false, error: "PIN is required" };
  }

  if (pin.length !== 6) {
    return { valid: false, error: "PIN must be exactly 6 digits" };
  }

  if (!/^\d{6}$/.test(pin)) {
    return { valid: false, error: "PIN must contain only digits" };
  }

  return { valid: true };
}

async function verifyPinInternal(state: StoredState, pin: string): Promise<PinVerifyResult> {
  const lockStatus = getLockStatusFromState(state);
  if (lockStatus.isLocked) {
    return {
      success: false,
      valid: false,
      attemptsRemaining: lockStatus.attemptsRemaining,
    };
  }

  if (!state.pinHash) {
    return { success: false, valid: false, attemptsRemaining: MAX_ATTEMPTS };
  }

  const hashed = await hashPin(pin);
  if (hashed === state.pinHash) {
    state.failCount = 0;
    state.lockUntil = undefined;
    writeState(state);
    return { success: true, valid: true, attemptsRemaining: MAX_ATTEMPTS };
  }

  state.failCount = Math.min(state.failCount + 1, MAX_ATTEMPTS);
  if (state.failCount >= MAX_ATTEMPTS) {
    lockAccount(state);
  } else {
    writeState(state);
  }

  const updated = getLockStatusFromState(state);
  return {
    success: true,
    valid: false,
    attemptsRemaining: updated.attemptsRemaining,
  };
}

export const PinAuth: PinAuthPlugin & {
  isAvailable(): boolean;
  changePin(oldPin: string, newPin: string): Promise<{ success: boolean }>;
  getLockStatus(): Promise<LockStatus>;
} = {
  async hasPin() {
    if (!isPinAuthAvailable()) {
      return { hasPin: false };
    }

    const state = readState();
    return { hasPin: Boolean(state.pinHash) };
  },

  async setPin({ pin }) {
    if (!isPinAuthAvailable()) {
      throw new Error("PIN authentication is only available in supported browsers");
    }

    const validation = validatePinFormat(pin);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const state = readState();
    state.pinHash = await hashPin(pin);
    state.failCount = 0;
    state.lockUntil = undefined;
    writeState(state);
    return { success: true };
  },

  async verifyPin({ pin }) {
    if (!isPinAuthAvailable()) {
      throw new Error("PIN authentication is not available in this environment");
    }

    const validation = validatePinFormat(pin);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const state = readState();
    return verifyPinInternal(state, pin);
  },

  async deletePin() {
    if (!isPinAuthAvailable()) {
      return { success: true };
    }

    const state = readState();
    state.pinHash = undefined;
    state.failCount = 0;
    state.lockUntil = undefined;
    writeState(state);
    return { success: true };
  },

  async changePin(oldPin, newPin) {
    if (!isPinAuthAvailable()) {
      throw new Error("PIN authentication is not available in this environment");
    }

    const oldValidation = validatePinFormat(oldPin);
    if (!oldValidation.valid) {
      throw new Error(`Old PIN: ${oldValidation.error}`);
    }

    const newValidation = validatePinFormat(newPin);
    if (!newValidation.valid) {
      throw new Error(`New PIN: ${newValidation.error}`);
    }

    if (oldPin === newPin) {
      throw new Error("New PIN must be different from old PIN");
    }

    const state = readState();
    const result = await verifyPinInternal(state, oldPin);
    if (!result.valid) {
      throw new Error("Incorrect PIN");
    }

    state.pinHash = await hashPin(newPin);
    state.failCount = 0;
    state.lockUntil = undefined;
    writeState(state);
    return { success: true };
  },

  async getLockStatus() {
    if (!isPinAuthAvailable()) {
      return {
        isLocked: false,
        remainingSeconds: 0,
        failCount: 0,
        attemptsRemaining: MAX_ATTEMPTS,
      };
    }

    const state = readState();
    return getLockStatusFromState(state);
  },

  isAvailable() {
    return isPinAuthAvailable();
  },
};

export default PinAuth;
