export type NormalizedTxn = {
  amount: number;          // in minor unit or integer RWF
  txnId: string;
  ts: string;              // ISO time
  payerMsisdn?: string;
  rawRef?: string;
};

export interface StatementAdapter {
  name: string;            // e.g., "RW.MTN.statement.v1"
  parseRow: (row: Record<string, string>) => NormalizedTxn | null;
}

export interface SmsAdapter {
  name: string;            // e.g., "RW.MTN.sms.v1"
  parseSms: (text: string) => NormalizedTxn | null;
}

export interface ReferenceDecoder {
  name: string;            // e.g., "ref.C3.D3.S3.G4.M3"
  decode: (rawRef: string) => {
    country?: string; district?: string; sacco?: string; group?: string; member?: string;
  } | null;
}

export type ProviderRegistry = {
  statement: Record<string, StatementAdapter>;  // key: `${iso2}.${telco}.statement`
  sms: Record<string, SmsAdapter>;              // key: `${iso2}.${telco}.sms`
  decoder: ReferenceDecoder;
};
