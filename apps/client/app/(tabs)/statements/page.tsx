/**
 * Statements Page - Allocation-Based Transaction History
 */

import type { StatementEntry } from "@/components/statements/statements-table";
import { loadStatements } from "@/lib/data/statements";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { StatementsTableLazy } from "@/components/statements/statements-table.lazy";

export const metadata = {
  title: "Statements | SACCO+ Client",
  description: "View your transaction history and statements",
};

async function exportStatements(period: string) {
  "use server";

  const supabase = await createSupabaseServerClient();
  try {
    await supabase.functions.invoke("export-report", {
      body: {
        report: "member_allocations",
        format: "pdf",
        period,
      },
    });
  } catch (error) {
    console.error("Failed to request statement export", error);
    throw new Error("We could not start the export. Please try again later.");
  }
}

export default async function StatementsPage() {
  const data = await loadStatements();

  const handleExportPDF = async (period: string) => {
    "use server";
    await exportStatements(period);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-screen-xl px-4 py-6">
          <h1 className="text-2xl font-bold text-neutral-900">My Statements</h1>
          <p className="mt-1 text-sm text-neutral-700">
            View your transaction history and export statements
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 py-6">
        {data.entries.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mb-2 text-lg text-neutral-700">No statements available</p>
            <p className="text-sm text-neutral-700">
              Make your first contribution to see statements here
            </p>
          </div>
        ) : (
          <StatementsTableLazy
            entries={data.entries as StatementEntry[]}
            onExportPDF={handleExportPDF}
          />
        )}

        <div className="mt-8 rounded-2xl border border-atlas-blue/20 bg-atlas-glow p-6">
          <h2 className="mb-3 text-base font-bold text-atlas-blue-dark">About your statements</h2>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>
                <strong>Confirmed:</strong> Payments that have been verified and allocated to your
                account
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>
                <strong>Pending:</strong> Recent payments waiting for confirmation from mobile money
                provider
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>
                <strong>Reference code:</strong> Each transaction is linked to your unique reference
                token
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>
                <strong>Export PDF:</strong> Download your statements for personal records
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
