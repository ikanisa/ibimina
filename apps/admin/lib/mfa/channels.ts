import { sessionTtlSeconds, trustedTtlSeconds } from "@/lib/mfa/session";

export type PasskeySummaryRecord = {
  last_used_at: string | null;
};

export type EmailCodeRecord = {
  created_at: string | null;
  consumed_at: string | null;
  expires_at: string;
};

export type MfaChannelSummary = {
  policy: {
    primary: "PASSKEY" | "TOTP" | "EMAIL";
    recovery: string[];
    sessionSeconds: number;
    trustedDeviceSeconds: number;
  };
  channels: Array<{
    id: "PASSKEY" | "TOTP" | "EMAIL";
    enrolled: boolean;
    available: boolean;
    passkeyCount?: number;
    lastUsedAt?: string | null;
    enrolledAt?: string | null;
    backupCodesRemaining?: number;
    destination?: string | null;
    activeCodes?: number;
    lastIssuedAt?: string | null;
    lastConsumedAt?: string | null;
  }>;
};

export const maskEmail = (value: string | null | undefined) => {
  if (!value) return null;
  const [localPart, domainPart] = value.split("@");
  if (!domainPart) {
    return value;
  }

  if (localPart.length <= 2) {
    return `${localPart.charAt(0)}***@${domainPart}`;
  }

  const first = localPart.charAt(0);
  const last = localPart.charAt(localPart.length - 1);
  const middle = "*".repeat(Math.min(4, Math.max(1, localPart.length - 2)));
  return `${first}${middle}${last}@${domainPart}`;
};

export const buildChannelSummary = ({
  mfaEnabled,
  passkeyEnrolled,
  backupCount,
  enrolledAt,
  email,
  passkeyRecords,
  emailCodeRecords,
  activeMethods,
}: {
  mfaEnabled: boolean;
  passkeyEnrolled: boolean;
  backupCount: number;
  enrolledAt: string | null;
  email: string | null;
  passkeyRecords: PasskeySummaryRecord[];
  emailCodeRecords: EmailCodeRecord[];
  activeMethods: string[];
}): MfaChannelSummary => {
  const nowIso = new Date().toISOString();
  const activeEmailCodes = emailCodeRecords.filter(
    (code) => !code.consumed_at && code.expires_at >= nowIso
  );

  const lastEmailIssuedAt =
    emailCodeRecords.length > 0 ? (emailCodeRecords[0].created_at ?? null) : null;
  const lastEmailConsumedAt =
    emailCodeRecords.find((code) => Boolean(code.consumed_at))?.consumed_at ?? null;

  const lastPasskeyUsedAt = passkeyRecords.reduce<string | null>((latest, record) => {
    if (!record.last_used_at) {
      return latest;
    }
    if (!latest || record.last_used_at > latest) {
      return record.last_used_at;
    }
    return latest;
  }, null);

  const methodSet = new Set(activeMethods ?? []);
  const passkeyActive = passkeyEnrolled || methodSet.has("PASSKEY");
  const totpActive = methodSet.has("TOTP") && mfaEnabled;
  const emailActive = methodSet.has("EMAIL") && mfaEnabled;

  const primaryChannel = passkeyActive
    ? "PASSKEY"
    : totpActive
      ? "TOTP"
      : emailActive
        ? "EMAIL"
        : "TOTP";
  const recoveryChannels = [
    ...(totpActive && primaryChannel !== "TOTP" ? ["TOTP"] : []),
    ...(emailActive && primaryChannel !== "EMAIL" ? ["EMAIL"] : []),
    ...(passkeyActive && primaryChannel !== "PASSKEY" ? ["PASSKEY"] : []),
  ];

  return {
    policy: {
      primary: primaryChannel,
      recovery: recoveryChannels.length > 0 ? recoveryChannels : ["EMAIL"],
      sessionSeconds: sessionTtlSeconds(),
      trustedDeviceSeconds: trustedTtlSeconds(),
    },
    channels: [
      {
        id: "PASSKEY",
        enrolled: passkeyActive,
        available: true,
        passkeyCount: passkeyRecords.length,
        lastUsedAt: lastPasskeyUsedAt,
      },
      {
        id: "TOTP",
        enrolled: totpActive,
        available: true,
        enrolledAt,
        backupCodesRemaining: backupCount,
      },
      {
        id: "EMAIL",
        enrolled: emailActive,
        available: Boolean(email),
        destination: maskEmail(email),
        activeCodes: activeEmailCodes.length,
        lastIssuedAt: lastEmailIssuedAt,
        lastConsumedAt: lastEmailConsumedAt,
      },
    ],
  };
};
