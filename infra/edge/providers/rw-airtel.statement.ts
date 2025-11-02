import { NormalizedTxn, StatementAdapter } from "./types.ts";

const RW_AIRTEL_STATEMENT_SCAFFOLD: StatementAdapter = {
  name: "RW.Airtel.statement.todo",
  parseRow(_row: Record<string, string>): NormalizedTxn | null {
    // Placeholder to ensure Airtel Money statements can be onboarded quickly
    // without breaking ingestion for live providers.
    return null;
  }
};

export default RW_AIRTEL_STATEMENT_SCAFFOLD;
