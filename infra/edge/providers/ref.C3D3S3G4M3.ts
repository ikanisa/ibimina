import { ReferenceDecoder } from "./types.ts";

// Format: COUNTRY3.DISTRICT3.SACCO3.GROUP4.MEMBER3
const Decoder: ReferenceDecoder = {
  name: "ref.C3.D3.S3.G4.M3",
  decode(rawRef: string){
    const parts = rawRef.trim().split(".");
    if (parts.length !== 5) return null;
    const [country, district, sacco, group, member] = parts;
    return { country, district, sacco, group, member };
  }
};
export default Decoder;
