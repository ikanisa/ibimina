import { SmsAdapter, NormalizedTxn } from "./types.ts";

const RW_MTN_SMS_V1: SmsAdapter = {
  name: "RW.MTN.sms.v1",
  parseSms(text: string): NormalizedTxn | null {
    const re = /RWF\s*([\d,]+).*?(from|to)\s*(\+?2507\d{8}|07\d{8}).*?Ref[: ]\s*([A-Z]{3}\.[A-Z]{3}\.[A-Z0-9]{3,8}\.[0-9]{3}).*?(Txn|TXN)[: ]\s*([A-Za-z0-9]+).*?(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/i;
    const m = text.match(re);
    if (!m) return null;
    const amount = parseInt(m[1].replace(/,/g, ""), 10);
    const payerMsisdn = m[3];
    const rawRef = m[4];
    const txnId = m[6];
    const ts = new Date(m[7].replace(" ", "T")+":00Z").toISOString();
    return { amount, txnId, ts, payerMsisdn, rawRef };
  }
};
export default RW_MTN_SMS_V1;
