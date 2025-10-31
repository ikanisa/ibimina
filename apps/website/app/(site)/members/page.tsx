import { Section } from "../components/Section";

export default function MembersPage() {
  return (
    <>
      <Section title="For Members (any phone, USSD first)">
        <ul className="list-disc ml-6 space-y-2">
          <li>
            Get your <strong>merchant code</strong> and <strong>reference token</strong> from your
            SACCO/leader.
          </li>
          <li>
            Dial USSD (e.g., <code>*182#</code>) → Pay merchant → Amount → paste your{" "}
            <strong>reference</strong>.
          </li>
          <li>
            Money goes <strong>directly to the SACCO&apos;s MoMo account</strong>; you get an SMS
            confirmation.
          </li>
          <li>
            (Optional app) See your <strong>group card</strong> and <strong>statements</strong>, and
            tap-to-dial USSD.
          </li>
        </ul>
      </Section>
      <Section title="Why references matter">
        <p>
          The reference token lets SACCO+ produce a <strong>clean allocation</strong> so staff
          recognize your deposit under the right <strong>ikimina</strong> and{" "}
          <strong>member</strong>.
        </p>
      </Section>
      <Section title="Privacy">
        <p>
          You only see your groups and statements. SACCO staff see only their SACCO; district sees
          aggregates if authorized.
        </p>
      </Section>
    </>
  );
}
