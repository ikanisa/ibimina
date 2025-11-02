import { NormalizedTxn, StatementAdapter } from "./types.ts";

const UG_MTN_STATEMENT_SCAFFOLD: StatementAdapter = {
  name: "UG.MTN.statement.todo",
  parseRow(_row: Record<string, string>): NormalizedTxn | null {
    return null;
  }
};

export default UG_MTN_STATEMENT_SCAFFOLD;
