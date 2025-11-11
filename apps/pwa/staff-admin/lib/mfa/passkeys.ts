/**
 * WebAuthn Passkey Management Module
 *
 * This module implements WebAuthn/FIDO2 passkey authentication for multi-factor
 * authentication (MFA). It provides server-side functions for passkey registration
 * and verification using the SimpleWebAuthn library.
 *
 * Key features:
 * - Passkey registration (credential creation)
 * - Passkey authentication (credential verification)
 * - Secure credential storage with encrypted private data
 * - Support for multiple passkeys per user
 * - Device attestation and verification
 *
 * Environment variables:
 * - MFA_RP_ID: Relying Party ID (defaults to hostname from SITE_URL)
 * - MFA_RP_NAME: Relying Party display name (defaults to "SACCO+")
 * - MFA_ORIGIN: Expected origin for WebAuthn ceremonies
 *
 * @module lib/mfa/passkeys
 */

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { encryptSensitiveString, decryptSensitiveString } from "@/lib/mfa/crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

/** Relying Party display name shown to users during passkey creation */
const rpName = process.env.MFA_RP_NAME ?? "SACCO+";

/**
 * Converts a buffer to base64url encoding (URL-safe base64)
 * @param buffer - ArrayBuffer or Uint8Array to encode
 * @returns Base64url encoded string
 */
const bufferToBase64Url = (buffer: ArrayBuffer | Uint8Array) =>
  Buffer.from(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)).toString("base64url");

/**
 * Converts base64url string to Uint8Array
 * @param value - Base64url encoded string
 * @returns Decoded Uint8Array
 */
const base64UrlToUint8Array = (value: string) => new Uint8Array(Buffer.from(value, "base64url"));

/**
 * Determines the Relying Party ID for WebAuthn ceremonies
 * Priority: MFA_RP_ID env var > hostname from SITE_URL > "localhost"
 * @returns Relying Party ID string
 */
const getRpId = () => {
  const explicit = process.env.MFA_RP_ID;
  if (explicit) return explicit;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (siteUrl) {
    try {
      const url = new URL(siteUrl);
      return url.hostname;
    } catch {
      // ignore parse failure
    }
  }

  return "localhost";
};

/**
 * Determines the expected origin for WebAuthn ceremonies
 * Priority: MFA_ORIGIN > SITE_URL > inferred from RP ID
 * @returns Expected origin URL string
 */
const getExpectedOrigin = () => {
  const explicit =
    process.env.MFA_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (explicit) return explicit;

  const rpID = getRpId();
  if (rpID === "localhost") {
    return process.env.MFA_DEV_ORIGIN ?? "http://localhost:3100";
  }
  return `https://${rpID}`;
};

const rpID = getRpId();
const expectedOrigin = getExpectedOrigin();

const getAdminClient = () => createSupabaseAdminClient();
const encoder = new TextEncoder();

type CredentialRow = Database["public"]["Tables"]["webauthn_credentials"]["Row"];

const toAuthenticatorTransports = (values?: string[] | null) =>
  (values ?? []).filter(Boolean).map((item) => item as AuthenticatorTransportFuture);

const listUserCredentials = async (userId: string) => {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("webauthn_credentials")
    .select(
      "id, user_id, credential_id, credential_public_key, sign_count, transports, backed_up, device_type, friendly_name, created_at, last_used_at"
    )
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return (data ?? []) as CredentialRow[];
};

type PasskeyState =
  | { type: "register"; userId: string; challenge: string; friendlyName?: string | null }
  | { type: "authenticate"; userId: string; challenge: string; rememberDevice?: boolean };

export const encodePasskeyState = (payload: PasskeyState) =>
  encryptSensitiveString(JSON.stringify(payload));

export const decodePasskeyState = (token: string): PasskeyState => {
  const json = decryptSensitiveString(token);
  return JSON.parse(json) as PasskeyState;
};

export const createRegistrationOptions = async (user: {
  id: string;
  email?: string | null;
  full_name?: string | null;
}) => {
  const credentials = await listUserCredentials(user.id);
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: encoder.encode(user.id),
    userName: user.email ?? user.id,
    userDisplayName: user.full_name ?? user.email ?? user.id,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
    },
    excludeCredentials: credentials.map((credential) => ({
      id: credential.credential_id,
      transports: toAuthenticatorTransports(credential.transports),
    })),
  });

  const stateToken = encodePasskeyState({
    type: "register",
    userId: user.id,
    challenge: options.challenge,
  });

  return {
    options,
    stateToken,
  };
};

type RegistrationVerificationResult = {
  credential: CredentialRow;
  firstPasskey: boolean;
};

export const verifyRegistration = async (
  user: { id: string; email?: string | null },
  response: RegistrationResponseJSON,
  stateToken: string,
  friendlyName?: string | null
): Promise<RegistrationVerificationResult> => {
  const state = decodePasskeyState(stateToken);
  if (state.type !== "register" || state.userId !== user.id) {
    throw new Error("invalid_state");
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: state.challenge,
    expectedOrigin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("verification_failed");
  }

  const { credential, credentialBackedUp, credentialDeviceType } = verification.registrationInfo;

  const credentialIdEncoded = credential.id;
  const publicKeyEncoded = bufferToBase64Url(credential.publicKey);

  const existing = await listUserCredentials(user.id);
  const firstPasskey = existing.length === 0;

  const payload: Database["public"]["Tables"]["webauthn_credentials"]["Insert"] = {
    user_id: user.id,
    credential_id: credentialIdEncoded,
    credential_public_key: publicKeyEncoded,
    sign_count: credential.counter,
    transports: credential.transports ?? [],
    backed_up: credentialBackedUp,
    device_type: credentialDeviceType ?? null,
    friendly_name: friendlyName ?? null,
    last_used_at: new Date().toISOString(),
  };

  const supabase = getAdminClient();
  const { data, error } = await (supabase as any)
    .from("webauthn_credentials")
    .upsert(payload, { onConflict: "credential_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("failed_to_persist_passkey");
  }

  return {
    credential: data as CredentialRow,
    firstPasskey,
  };
};

type AuthenticationOptionsResult = {
  options: PublicKeyCredentialRequestOptionsJSON;
  stateToken: string;
};

export const createAuthenticationOptions = async (
  user: { id: string },
  rememberDevice = false
): Promise<AuthenticationOptionsResult> => {
  const credentials = await listUserCredentials(user.id);
  if (credentials.length === 0) {
    throw new Error("no_credentials");
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map((credential) => ({
      id: credential.credential_id,
      transports: toAuthenticatorTransports(credential.transports),
    })),
    userVerification: "required",
  });

  const stateToken = encodePasskeyState({
    type: "authenticate",
    userId: user.id,
    challenge: options.challenge,
    rememberDevice,
  });

  return { options, stateToken };
};

type AuthenticationVerificationResult = {
  credential: CredentialRow;
  rememberDevice: boolean;
};

export const verifyAuthentication = async (
  user: { id: string },
  response: AuthenticationResponseJSON,
  stateToken: string
): Promise<AuthenticationVerificationResult> => {
  const state = decodePasskeyState(stateToken);
  if (state.type !== "authenticate" || state.userId !== user.id) {
    throw new Error("invalid_state");
  }

  const credentialIdEncoded = response.rawId ?? response.id;
  const credentials = await listUserCredentials(user.id);
  const credential = credentials.find((item) => item.credential_id === credentialIdEncoded);

  if (!credential) {
    throw new Error("credential_not_found");
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: state.challenge,
    expectedOrigin,
    expectedRPID: rpID,
    credential: {
      id: credential.credential_id,
      publicKey: base64UrlToUint8Array(credential.credential_public_key),
      counter: credential.sign_count ?? 0,
      transports: credential.transports
        ? toAuthenticatorTransports(credential.transports)
        : undefined,
    },
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.authenticationInfo) {
    throw new Error("verification_failed");
  }

  const { newCounter, credentialBackedUp, credentialDeviceType } = verification.authenticationInfo;

  const supabase = getAdminClient();
  const updatePayload: Database["public"]["Tables"]["webauthn_credentials"]["Update"] = {
    sign_count: newCounter,
    last_used_at: new Date().toISOString(),
    backed_up: credentialBackedUp,
    device_type: credentialDeviceType,
  };

  const { error } = await (supabase as any)
    .from("webauthn_credentials")
    .update(updatePayload)
    .eq("credential_id", credential.credential_id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  return { credential, rememberDevice: state.rememberDevice ?? false };
};

export const markPasskeyEnrollment = async (userId: string, firstPasskey: boolean) => {
  const supabase = getAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("users")
    .select("mfa_methods, mfa_enabled, mfa_enrolled_at, mfa_passkey_enrolled")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  type UserMfaFields = Pick<
    Database["public"]["Tables"]["users"]["Row"],
    "mfa_methods" | "mfa_enabled" | "mfa_enrolled_at" | "mfa_passkey_enrolled"
  >;
  const existingFields = existing as UserMfaFields | null;

  const methods = new Set(existingFields?.mfa_methods ?? []);
  methods.add("PASSKEY");

  const update: Database["public"]["Tables"]["users"]["Update"] = {
    mfa_methods: Array.from(methods.values()),
    mfa_passkey_enrolled: true,
  };

  if (!existingFields?.mfa_enabled && firstPasskey) {
    update.mfa_enabled = true;
    update.mfa_enrolled_at = new Date().toISOString();
  } else if (!existingFields?.mfa_enrolled_at) {
    update.mfa_enrolled_at = new Date().toISOString();
  }

  const { error } = await (supabase as any).from("users").update(update).eq("id", userId);
  if (error) {
    throw error;
  }
};

export const clearPasskeyEnrollment = async (userId: string) => {
  const supabase = getAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("users")
    .select("mfa_methods")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  type UserMfaFields = Pick<Database["public"]["Tables"]["users"]["Row"], "mfa_methods">;
  const existingFields = existing as UserMfaFields | null;

  const methods = new Set(existingFields?.mfa_methods ?? []);
  methods.delete("PASSKEY");

  const update: Database["public"]["Tables"]["users"]["Update"] = {
    mfa_methods: Array.from(methods.values()),
    mfa_passkey_enrolled: false,
  };

  if (methods.size === 0) {
    update.mfa_enabled = false;
    update.mfa_enrolled_at = null;
  }

  const { error } = await (supabase as any).from("users").update(update).eq("id", userId);
  if (error) {
    throw error;
  }
};

export const deletePasskeyCredential = async (userId: string, credentialId: string) => {
  const supabase = getAdminClient();

  const { data, error } = await (supabase as any)
    .from("webauthn_credentials")
    .delete()
    .eq("id", credentialId)
    .eq("user_id", userId)
    .select("credential_id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return false;
  }

  const remaining = await listUserCredentials(userId);
  if (remaining.length === 0) {
    await clearPasskeyEnrollment(userId);
  }

  return true;
};
