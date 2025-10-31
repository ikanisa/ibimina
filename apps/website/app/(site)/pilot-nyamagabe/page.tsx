import { Section } from "../components/Section";

export default function PilotPage() {
  return (
    <>
      <Section title="Nyamagabe Pilot — Intermediated Deposit Mobilisation">
        <p>
          Objective: convert informal ibimina flows into <strong>formal SACCO deposits</strong> via
          <strong> USSD + standardized references</strong>, and supply clean allocation evidence to
          staff.
        </p>
      </Section>
      <Section title="Scope & success metrics (illustrative)">
        <ul className="list-disc ml-6 space-y-2">
          <li>~600 ibimina / ~15,000 members; USSD day 1; dashboards for SACCO & District.</li>
          <li>Adoption: % ibimina with ≥1 USSD deposit; % active members.</li>
          <li>Allocation quality: Unallocated &lt; X% by week 4; duplicates/mismatch &lt; Y%.</li>
          <li>Ops impact: exception closure &lt; 48h; queue time ↓; staff time saved per cycle.</li>
        </ul>
      </Section>
      <Section title="Support & governance">
        <p>
          Kinyarwanda training; USSD cards; market-day demos; helpdesk; weekly reviews; telecom
          liaison. Working group: MINECOFIN, RCA, District, Umurenge SACCOs, SACCO+.
        </p>
      </Section>
    </>
  );
}
