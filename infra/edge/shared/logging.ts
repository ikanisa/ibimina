function mask(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  if (value.length <= 4) return "***";
  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}

export function redactPayload<T extends Record<string, unknown>>(payload: T): T {
  const clone: Record<string, unknown> = { ...payload };
  if (typeof clone.payer_msisdn === "string") {
    clone.payer_msisdn = mask(clone.payer_msisdn);
  }
  if (typeof clone.raw_ref === "string") {
    clone.raw_ref = mask(clone.raw_ref);
  }
  if (typeof clone.txn_id === "string") {
    clone.txn_id = mask(clone.txn_id);
  }
  return clone as T;
}

export function logRedacted(event: string, payload: Record<string, unknown>) {
  console.log(`[edge] ${event}`, redactPayload(payload));
}
