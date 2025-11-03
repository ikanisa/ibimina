import { createHmac } from "node:crypto";
import { Buffer } from "node:buffer";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SecureKeyStore {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string): Promise<void> | void;
}

export class InMemoryKeyStore implements SecureKeyStore {
  private readonly store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
}

export interface TapMoMoBackendClientOptions {
  supabaseClient?: SupabaseClient;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  accessToken?: string;
  reconcileUrl: string;
  fetch?: typeof fetch;
}

export interface ReconcilePayload {
  transactionId: string;
  merchantId: string;
  amount?: number;
  currency?: string;
  status: "pending" | "settled" | "failed";
  payerHint?: string;
  notes?: string;
  ref?: string;
  nonce?: string;
}

export interface ReconcileSuccess {
  success: true;
  transaction: Record<string, unknown>;
}

export interface ReconcileFailure {
  success: false;
  error: string;
}

export type ReconcileResponse = ReconcileSuccess | ReconcileFailure;

interface MerchantSecretRow {
  secret_key: unknown;
}

const encoder = new TextEncoder();

const normalizeFetch = (fetchImpl?: typeof fetch) => {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch !== "undefined") {
    return fetch.bind(globalThis);
  }

  throw new Error("Global fetch is not available. Provide a fetch implementation.");
};

const decodeSecretKey = (value: unknown): Uint8Array => {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      throw new Error("empty merchant secret");
    }
    return new Uint8Array(Buffer.from(normalized, "base64"));
  }

  if (value && typeof value === "object" && "data" in (value as Record<string, unknown>)) {
    const data = (value as { data: number[] }).data;
    if (Array.isArray(data)) {
      return new Uint8Array(data);
    }
  }

  throw new Error("Unsupported merchant secret payload");
};

const deriveDeviceKey = (secret: Uint8Array, deviceIdentifier: string) => {
  const hmac = createHmac("sha256", Buffer.from(secret));
  hmac.update(deviceIdentifier);
  return hmac.digest("hex");
};

const buildStorageKey = (merchantId: string, deviceId: string) =>
  `tapmomo:${merchantId}:${deviceId}`;

const buildSignedMessage = (timestamp: string, context: string, body: string) => {
  const timestampBytes = encoder.encode(timestamp);
  const contextBytes = encoder.encode(context);
  const bodyBytes = encoder.encode(body);
  const message = Buffer.alloc(timestampBytes.length + contextBytes.length + bodyBytes.length);
  Buffer.from(timestampBytes).copy(message, 0);
  Buffer.from(contextBytes).copy(message, timestampBytes.length);
  Buffer.from(bodyBytes).copy(message, timestampBytes.length + contextBytes.length);
  return message;
};

const signPayload = (deviceKeyHex: string, body: string, url: string) => {
  const timestamp = new Date().toISOString();
  const context = `POST:${new URL(url).pathname}`;
  const message = buildSignedMessage(timestamp, context, body);
  const hmac = createHmac("sha256", Buffer.from(deviceKeyHex, "hex"));
  hmac.update(message);
  const signature = hmac.digest("hex");
  return { signature, timestamp };
};

export class TapMoMoBackendClient {
  private readonly supabase: SupabaseClient;
  private readonly anonKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly reconcileUrl: string;
  private overrideAccessToken?: string;

  constructor(options: TapMoMoBackendClientOptions) {
    if (options.supabaseClient) {
      this.supabase = options.supabaseClient;
      this.anonKey = options.supabaseAnonKey ?? "";
    } else {
      if (!options.supabaseUrl || !options.supabaseAnonKey) {
        throw new Error("Provide either a Supabase client or URL and anon key.");
      }
      this.supabase = createClient(options.supabaseUrl, options.supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      this.anonKey = options.supabaseAnonKey;
    }

    this.reconcileUrl = options.reconcileUrl;
    this.fetchImpl = normalizeFetch(options.fetch);
    this.overrideAccessToken = options.accessToken ?? undefined;
  }

  /**
   * Override the access token used when calling Supabase Edge Functions.
   * This is useful when the caller controls session refreshes manually.
   */
  setAccessToken(token: string | null) {
    this.overrideAccessToken = token ?? undefined;
  }

  private async resolveAccessToken(): Promise<string | null> {
    if (this.overrideAccessToken) {
      return this.overrideAccessToken;
    }

    if ("auth" in this.supabase && typeof this.supabase.auth.getSession === "function") {
      const { data } = await this.supabase.auth.getSession();
      return data?.session?.access_token ?? null;
    }

    return null;
  }

  /**
   * Fetches the raw merchant signing secret from Supabase.
   */
  async fetchMerchantSecret(merchantId: string): Promise<Uint8Array> {
    const { data, error } = await this.supabase
      .from("merchants")
      .select("secret_key")
      .eq("id", merchantId)
      .single<MerchantSecretRow>();

    if (error || !data) {
      throw new Error(`Failed to fetch merchant secret: ${error?.message ?? "not found"}`);
    }

    return decodeSecretKey(data.secret_key);
  }

  /**
   * Derives a per-device key suitable for storage inside Android Keystore or iOS Keychain.
   * If the key already exists in the provided secure storage, it will be reused.
   */
  async getOrCreateDeviceKey(params: {
    merchantId: string;
    deviceId: string;
    storage: SecureKeyStore;
  }): Promise<string> {
    const storageKey = buildStorageKey(params.merchantId, params.deviceId);
    const existing = await params.storage.get(storageKey);
    if (existing) {
      return existing;
    }

    const secret = await this.fetchMerchantSecret(params.merchantId);
    const derived = deriveDeviceKey(secret, params.deviceId);
    await params.storage.set(storageKey, derived);
    return derived;
  }

  /**
   * Calls the reconcile Edge Function using the provided device-scoped key.
   * The payload is signed with HMAC headers to satisfy server-side verification.
   */
  async reconcileTransaction(
    payload: ReconcilePayload,
    options: { deviceKey: string }
  ): Promise<ReconcileResponse> {
    const body = JSON.stringify(
      Object.fromEntries(
        Object.entries({
          transaction_id: payload.transactionId,
          merchant_id: payload.merchantId,
          amount: payload.amount,
          currency: payload.currency,
          status: payload.status,
          payer_hint: payload.payerHint,
          notes: payload.notes,
          ref: payload.ref,
          nonce: payload.nonce,
        }).filter(([, value]) => value !== undefined && value !== null)
      )
    );

    const { signature, timestamp } = signPayload(options.deviceKey, body, this.reconcileUrl);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-signature": signature,
      "x-timestamp": timestamp,
    };

    if (this.anonKey) {
      headers.apikey = this.anonKey;
    }

    const accessToken = await this.resolveAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    } else if (this.anonKey) {
      headers.Authorization = `Bearer ${this.anonKey}`;
    }

    const response = await this.fetchImpl(this.reconcileUrl, {
      method: "POST",
      headers,
      body,
    });

    let json: unknown = null;
    try {
      json = await response.json();
    } catch {
      // ignore JSON parse errors, response may be empty on failure
    }

    if (!response.ok) {
      const errorMessage =
        typeof json === "object" && json !== null && "error" in json
          ? String((json as { error: unknown }).error)
          : "Failed to reconcile transaction";
      return { success: false, error: errorMessage };
    }

    return json as ReconcileResponse;
  }
}

export const tapmomoInternals = {
  decodeSecretKey,
  deriveDeviceKey,
  buildStorageKey,
  signPayload,
};
