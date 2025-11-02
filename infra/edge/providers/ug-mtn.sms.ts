import { NormalizedTxn, SmsAdapter } from "./types.ts";

const UG_MTN_SMS_SCAFFOLD: SmsAdapter = {
  name: "UG.MTN.sms.todo",
  parseSms(_text: string): NormalizedTxn | null {
    return null;
  }
};

export default UG_MTN_SMS_SCAFFOLD;
