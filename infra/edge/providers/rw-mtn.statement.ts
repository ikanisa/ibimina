import { NormalizedTxn, StatementAdapter } from "./types.ts";

function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const value = Number.parseFloat(cleaned);
  if (Number.isNaN(value)) return null;
  return Math.round(value);
}

function parseTimestamp(raw: string | undefined): string | null {
  if (!raw) return null;
  const normalized = raw.trim().replace(/\//g, "-");
  const date = new Date(normalized.includes("T") ? normalized : normalized.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

const RW_MTN_STATEMENT_V1: StatementAdapter = {
  name: "RW.MTN.statement.v1",
  parseRow(row: Record<string, string>): NormalizedTxn | null {
    const txnId = row["Transaction ID"]?.trim() || row["Txn ID"]?.trim();
    if (!txnId) return null;

    const amount = parseAmount(row["Amount"] ?? row["Amount (RWF)"]);
    const ts = parseTimestamp(row["Date"] ?? row["Timestamp"]);
    const rawRef = row["Reference"]?.trim() ?? row["Ref"]?.trim();
    const payerMsisdn = row["MSISDN"]?.trim() ?? row["Number"]?.trim();

    if (amount === null || ts === null) {
      return null;
    }

    const normalized: NormalizedTxn = {
      amount,
      txnId,
      ts,
      payerMsisdn,
      rawRef
    };

    return normalized;
  }
};

export default RW_MTN_STATEMENT_V1;
