import { Section } from "../components/Section";

export default function SaccosPage() {
  return (
    <>
      <Section title="For Umurenge SACCOs (intermediation only)">
        <ul className="list-disc ml-6 space-y-2">
          <li>
            Collect ibimina lists (photo/CSV) → upload in Staff App → <strong>OCR extract</strong>.
          </li>
          <li>
            Verify <strong>Full Name • MoMo • NID</strong>; approve groups & members.
          </li>
          <li>
            Distribute <strong>USSD instruction cards</strong> (merchant code + reference token).
          </li>
          <li>
            Download <strong>allocation reports</strong>: Allocated/Unallocated; exceptions with
            suggestions.
          </li>
          <li>
            <strong>No integration</strong> with SACCO core; <strong>no funds held</strong> by
            SACCO+—money lands in your MoMo merchant account.
          </li>
        </ul>
      </Section>
      <Section title="Outputs you receive">
        <p>
          Daily/Weekly CSV/Excel with: Date | Amount | Txn ID | MSISDN? | Raw Ref | Decoded
          (District, SACCO, Group, Member) | Status | Notes.
        </p>
      </Section>
    </>
  );
}
