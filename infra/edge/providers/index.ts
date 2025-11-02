import { ProviderRegistry } from "./types.ts";
import RW_MTN_SMS_V1 from "./rw-mtn.sms.ts";
import RW_MTN_STATEMENT_V1 from "./rw-mtn.statement.ts";
import RW_AIRTEL_SMS_SCAFFOLD from "./rw-airtel.sms.ts";
import RW_AIRTEL_STATEMENT_SCAFFOLD from "./rw-airtel.statement.ts";
import UG_MTN_SMS_SCAFFOLD from "./ug-mtn.sms.ts";
import UG_MTN_STATEMENT_SCAFFOLD from "./ug-mtn.statement.ts";
import Decoder from "./ref.C3D3S3G4M3.ts";

export const registry: ProviderRegistry = {
  statement: {
    "rw.mtn.statement": RW_MTN_STATEMENT_V1,
    "rw.airtel.statement": RW_AIRTEL_STATEMENT_SCAFFOLD,
    "ug.mtn.statement": UG_MTN_STATEMENT_SCAFFOLD
  },
  sms: {
    "rw.mtn.sms": RW_MTN_SMS_V1,
    "rw.airtel.sms": RW_AIRTEL_SMS_SCAFFOLD,
    "ug.mtn.sms": UG_MTN_SMS_SCAFFOLD
  },
  decoder: Decoder
};
