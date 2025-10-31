import { Section } from "../../components/Section";

export default function TermsPage() {
  return (
    <Section title="Terms of Service (SACCO+)">
      <p>
        SACCO+ is an intermediation platform. We do not integrate to Umurenge SACCO core systems and
        we never hold or route funds. All deposits go directly to the SACCO&apos;s MoMo merchant
        account. We provide standardized references and allocation evidence only.
      </p>
      <ul className="list-disc ml-6 mt-2 space-y-2 text-white/90">
        <li>Scope limitations: deposit references and allocation reporting.</li>
        <li>Staff approvals: all onboarding/creation is controlled by SACCO staff.</li>
        <li>Privacy & RLS isolation: members, SACCOs, and districts see only permitted data.</li>
        <li>
          Allocation evidence: best-effort mapping based on reference standards and available
          statement/SMS evidence.
        </li>
      </ul>
    </Section>
  );
}
