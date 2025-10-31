import { Hero } from "./components/Hero";
import { Section } from "./components/Section";
import { FeatureCard } from "./components/FeatureCard";

export default function Page() {
  return (
    <>
      <Hero />
      <Section title="What we solve">
        <p>
          In villages, most savings sit in <strong>ibimina</strong>. Small, frequent deposits rarely
          reach Umurenge SACCOs because members must travel to branches and MoMo references are
          unstructured. SACCO+ is a <strong>standalone intermediary</strong>: we digitize ibimina,
          issue standardized USSD references, and produce <strong>allocation reports</strong> so
          SACCO staff recognize deposits under the right groups and members.
        </p>
      </Section>
      <Section title="How it works (simple)">
        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard title="USSD rail">
            Members dial USSD and pay to the SACCO&apos;s <strong>merchant code</strong>; all funds
            land in the SACCO&apos;s account.
          </FeatureCard>
          <FeatureCard title="Reference standard">
            Each group/member has a structured token (e.g., <code>DST.SAC.GRP.MBR</code>) placed in
            USSD &quot;reference&quot;.
          </FeatureCard>
          <FeatureCard title="Allocation evidence">
            Statements/SMS are normalized into a <strong>clean mapping</strong>{" "}
            (Allocated/Unallocated/Exceptions) for staff.
          </FeatureCard>
        </div>
      </Section>
    </>
  );
}
