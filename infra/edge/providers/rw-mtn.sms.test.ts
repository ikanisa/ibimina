import RW_MTN_SMS_V1 from "./rw-mtn.sms.ts";

Deno.test("RW MTN SMS adapter normalizes canonical payload", () => {
  const sms =
    "You have received RWF 1,500 from +250781234567. Ref: ABC.DEF.GHI.123 Txn: 987654 2025-01-31 08:12";
  const normalized = RW_MTN_SMS_V1.parseSms(sms);
  if (!normalized) throw new Error("expected normalization");
  if (normalized.amount !== 1500) throw new Error("unexpected amount");
  if (normalized.payerMsisdn !== "+250781234567") throw new Error("unexpected msisdn");
  if (normalized.rawRef !== "ABC.DEF.GHI.123") throw new Error("unexpected ref");
  if (normalized.txnId !== "987654") throw new Error("unexpected txn");
  if (!normalized.ts.startsWith("2025-01-31T08:12")) throw new Error("unexpected ts");
});

Deno.test("RW MTN SMS adapter rejects unsupported payload", () => {
  const normalized = RW_MTN_SMS_V1.parseSms("hello world");
  if (normalized !== null) throw new Error("should return null for unknown payload");
});
