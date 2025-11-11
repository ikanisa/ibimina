/**
 * Browser-friendly SMS ingestion utilities.
 *
 * These helpers emulate the shape of the original Capacitor powered module so
 * that the admin PWA can continue to render the SMS ingestion pages. The
 * functions persist their state to localStorage which keeps demos and tests
 * deterministic while clearly indicating that background SMS access is not
 * available in the web build.
 */

export interface PermissionStatus {
  readSms?: "granted" | "denied" | "prompt";
  receiveSms?: "granted" | "denied" | "prompt";
  state: "granted" | "denied" | "prompt";
}

export interface QueryOptions {
  limit?: number;
  since?: number;
}

export interface SmsMessage {
  id: number;
  address: string;
  body: string;
  timestamp: number;
  received_at: string;
}

export interface QueryResult {
  messages: SmsMessage[];
  count: number;
}

type SmsIngestState = {
  enabled: boolean;
  permission: PermissionStatus["state"];
  lastSync: number;
  intervalMinutes: number;
  config?: {
    edgeFunctionUrl: string;
    hmacSecret: string;
  };
  messages: SmsMessage[];
};

const STORAGE_KEY = "ibimina.smsIngest";

const isBrowser = () => typeof window !== "undefined";

const defaultState: SmsIngestState = {
  enabled: false,
  permission: "prompt",
  lastSync: 0,
  intervalMinutes: 15,
  messages: [],
};

function readState(): SmsIngestState {
  if (!isBrowser()) {
    return { ...defaultState };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultState };
    }

    const parsed = JSON.parse(raw) as Partial<SmsIngestState>;
    return {
      ...defaultState,
      ...parsed,
      permission:
        parsed && typeof parsed.permission === "string"
          ? (parsed.permission as SmsIngestState["permission"])
          : "prompt",
      enabled: Boolean(parsed?.enabled),
      lastSync: typeof parsed?.lastSync === "number" ? parsed.lastSync : 0,
      intervalMinutes: typeof parsed?.intervalMinutes === "number" ? parsed.intervalMinutes : 15,
      messages: Array.isArray(parsed?.messages) ? (parsed.messages as SmsMessage[]) : [],
    };
  } catch (error) {
    console.warn("Failed to read SMS ingest state", error);
    return { ...defaultState };
  }
}

function writeState(state: SmsIngestState): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to persist SMS ingest state", error);
  }
}

function maybeSeedMessages(state: SmsIngestState): SmsIngestState {
  if (state.messages.length > 0) {
    return state;
  }

  const now = Date.now();
  const baseMessages: SmsMessage[] = [
    {
      id: 1,
      address: "MTNMOMO",
      body: "MTN MoMo: RWF 25,000 received from John Doe. Fee RWF 0. Balance RWF 120,500.",
      timestamp: now - 1000 * 60 * 5,
      received_at: new Date(now - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 2,
      address: "AIRTELMONEY",
      body: "Airtel Money: Payment of RWF 5,000 to Savings Group confirmed. Fee RWF 0.",
      timestamp: now - 1000 * 60 * 30,
      received_at: new Date(now - 1000 * 60 * 30).toISOString(),
    },
  ];

  const next = { ...state, messages: baseMessages };
  writeState(next);
  return next;
}

export const SmsIngest = {
  isAvailable(): boolean {
    return isBrowser();
  },

  async checkPermissions(): Promise<PermissionStatus> {
    const state = readState();
    return {
      state: state.permission,
      readSms: state.permission,
      receiveSms: state.permission,
    };
  },

  async requestPermissions(): Promise<PermissionStatus> {
    const state = readState();
    state.permission = "granted";
    writeState(state);
    return {
      state: "granted",
      readSms: "granted",
      receiveSms: "granted",
    };
  },

  async isEnabled(): Promise<boolean> {
    const state = readState();
    return state.enabled && state.permission === "granted";
  },

  async configure(edgeFunctionUrl: string, hmacSecret: string): Promise<void> {
    const state = readState();
    state.config = { edgeFunctionUrl, hmacSecret };
    writeState(state);
  },

  async enable(): Promise<{ enabled: boolean; realtime: boolean }> {
    const state = readState();
    if (state.permission !== "granted") {
      throw new Error("SMS permissions are required before enabling ingestion");
    }

    state.enabled = true;
    state.lastSync = Date.now();
    writeState(state);
    return { enabled: true, realtime: false };
  },

  async disable(): Promise<{ enabled: boolean }> {
    const state = readState();
    state.enabled = false;
    writeState(state);
    return { enabled: false };
  },

  async querySmsInbox(options?: QueryOptions): Promise<QueryResult> {
    let state = readState();
    state = maybeSeedMessages(state);

    const since = options?.since ?? 0;
    const limit = options?.limit ?? 50;

    const filtered = state.messages
      .filter((message) => message.timestamp >= since)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return { messages: filtered, count: filtered.length };
  },

  async updateLastSyncTime(timestamp: number): Promise<{ success: boolean; timestamp: number }> {
    const state = readState();
    state.lastSync = timestamp;
    writeState(state);
    return { success: true, timestamp };
  },

  async scheduleBackgroundSync(intervalMinutes?: number): Promise<{ scheduled: boolean }> {
    const state = readState();
    state.intervalMinutes = intervalMinutes ?? state.intervalMinutes;
    writeState(state);
    return { scheduled: true };
  },

  async markSyncComplete(): Promise<void> {
    const state = readState();
    state.lastSync = Date.now();
    writeState(state);
  },
};

export function useSmsIngest() {
  const isAvailable = SmsIngest.isAvailable();
  return {
    isAvailable,
    configure: SmsIngest.configure.bind(SmsIngest),
    checkPermissions: SmsIngest.checkPermissions.bind(SmsIngest),
    requestPermissions: SmsIngest.requestPermissions.bind(SmsIngest),
    isEnabled: SmsIngest.isEnabled.bind(SmsIngest),
    enable: SmsIngest.enable.bind(SmsIngest),
    disable: SmsIngest.disable.bind(SmsIngest),
    querySmsInbox: SmsIngest.querySmsInbox.bind(SmsIngest),
    markSyncComplete: SmsIngest.markSyncComplete.bind(SmsIngest),
    scheduleBackgroundSync: SmsIngest.scheduleBackgroundSync.bind(SmsIngest),
  };
}

export default SmsIngest;
