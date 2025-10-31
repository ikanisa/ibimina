import { Section } from "../components/Section";

export default function FAQPage() {
  return (
    <>
      <Section title="FAQ — Quick answers">
        <h3 className="font-semibold">Do you integrate with SACCO core systems?</h3>
        <p>
          No. SACCO+ is standalone intermediation. All funds land in the SACCO&apos;s MoMo account;
          we supply allocation evidence only.
        </p>
        <h3 className="font-semibold mt-4">Do I need a smartphone?</h3>
        <p>
          No. Any phone can dial USSD. The client app is optional for viewing groups, references,
          and statements.
        </p>
        <h3 className="font-semibold mt-4">Who approves new groups/members?</h3>
        <p>Always SACCO staff. App requests remain PENDING until staff approve.</p>
        <h3 className="font-semibold mt-4">What about privacy?</h3>
        <p>
          RLS isolates data: members see their groups and statements only; staff see their SACCO;
          district sees aggregates if authorized.
        </p>
      </Section>
    </>
  );
}
