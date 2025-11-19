import { ReferenceCard } from "@/components/reference/reference-card";

export const metadata = {
  title: "QR preview | SACCO+ Client",
};

export default function QRPreviewPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-4">
        <header className="space-y-2">
          <p className="text-sm font-semibold text-atlas-blue">Testing helper</p>
          <h1 className="text-3xl font-bold text-neutral-900">Reference QR preview</h1>
          <p className="text-neutral-700">
            Use this page during QA to verify the QR reference card renders and can be copied
            without requiring production data.
          </p>
        </header>
        <ReferenceCard reference="RWA.TEST.0001.4242" memberName="QA Member" />
      </div>
    </main>
  );
}
