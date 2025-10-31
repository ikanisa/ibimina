import { Section } from "../../components/Section";

export default function PrivacyPage() {
  return (
    <Section title="Privacy Policy (SACCO+)">
      <p>
        We collect only the data needed to map deposits to ibimina and members (e.g., reference
        tokens, group/member identifiers, allocation evidence). We do not store card or wallet
        credentials; we do not process payments.
      </p>
      <ul className="list-disc ml-6 mt-2 space-y-2 text-white/90">
        <li>PII minimization and retention controls.</li>
        <li>Access isolation via Row-Level Security (RLS).</li>
        <li>Audit trails for uploads, approvals, and allocation decisions.</li>
        <li>Contact: [privacy email/contact here].</li>
      </ul>
    </Section>
  );
}
