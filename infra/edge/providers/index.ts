import { ProviderRegistry } from "./types.ts";
import RW_MTN_SMS_V1 from "./rw-mtn.sms.ts";
import Decoder from "./ref.C3D3S3G4M3.ts";

export const registry: ProviderRegistry = {
  statement: {
    // e.g., "rw.mtn.statement": RW_MTN_STATEMENT_V1
  },
  sms: {
    "rw.mtn.sms": RW_MTN_SMS_V1
  },
  decoder: Decoder
};
