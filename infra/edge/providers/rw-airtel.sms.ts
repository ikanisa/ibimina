import { NormalizedTxn, SmsAdapter } from "./types.ts";

const RW_AIRTEL_SMS_SCAFFOLD: SmsAdapter = {
  name: "RW.Airtel.sms.todo",
  parseSms(_text: string): NormalizedTxn | null {
    // Airtel Money SMS formats differ per channel. The scaffold returns null so
    // that ingestion gracefully skips unsupported payloads until a dedicated
    // parser is implemented.
    return null;
  }
};

export default RW_AIRTEL_SMS_SCAFFOLD;
