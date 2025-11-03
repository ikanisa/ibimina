import RW_MTN_STATEMENT_V1 from "./rw-mtn.statement.ts";

Deno.test("RW MTN statement adapter normalizes export row", () => {
  const row = {
    "Transaction ID": "TX123",
    Amount: "1,250",
    Date: "2025-01-15 10:30",
    Reference: "ABC.DEF.GHI.123",
    MSISDN: "+250789000111"
  } as Record<string, string>;

  const normalized = RW_MTN_STATEMENT_V1.parseRow(row);
  if (!normalized) throw new Error("expected normalization");
  if (normalized.amount !== 1250) throw new Error("unexpected amount");
  if (normalized.txnId !== "TX123") throw new Error("unexpected txn");
  if (normalized.rawRef !== "ABC.DEF.GHI.123") throw new Error("unexpected ref");
  if (normalized.payerMsisdn !== "+250789000111") throw new Error("unexpected msisdn");
  if (!normalized.ts.startsWith("2025-01-15T10:30")) throw new Error("unexpected ts");
});

Deno.test("RW MTN statement adapter skips incomplete row", () => {
  const row = { "Transaction ID": "", Amount: "--" } as Record<string, string>;
  const normalized = RW_MTN_STATEMENT_V1.parseRow(row);
  if (normalized !== null) throw new Error("expected null for invalid row");
});
