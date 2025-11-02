import { SmsAdapter, NormalizedTxn } from "./types.ts";

const RW_MTN_SMS_V1: SmsAdapter = {
  name: "RW.MTN.sms.v1",
  parseSms(text: string): NormalizedTxn | null {
    const normalizedText = text.replace(/\s+/g, " ").trim();
    const re = /RWF\s*([\d,]+).*?(?:from|to)\s*(\+?250\d{9}|0?7\d{8}).*?Ref[: ]\s*([A-Z]{3}\.[A-Z]{3}\.[A-Z0-9]{3,8}\.[0-9]{3,}).*?(?:Txn|TXN)[: ]\s*([A-Za-z0-9\-]+).*?(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?)/i;
    const match = normalizedText.match(re);
    if (!match) return null;

    const amount = parseInt(match[1].replace(/,/g, ""), 10);
    const payerMsisdn = match[2].replace(/^0/, "+250");
    const rawRef = match[3];
    const txnId = match[4];
    const timestamp = match[5].replace(" ", "T");
    const isoTs = timestamp.length === 16 ? `${timestamp}:00Z` : `${timestamp}Z`;

    return {
      amount,
      txnId,
      ts: new Date(isoTs).toISOString(),
      payerMsisdn,
      rawRef
    };
  }
};
export default RW_MTN_SMS_V1;
