/**
 * Statements Page - Allocation-Based Transaction History
 *
 * Displays member's transaction statements with filtering and PDF export.
 * Shows only transactions that match the user's reference tokens (RLS enforced).
 *
 * Features:
 * - Allocation-based entries filtered by reference token
 * - Month filters (This Month, Last Month, Custom)
 * - Status badges (CONFIRMED, PENDING)
 * - PDF export per period
 * - Summary statistics
 */

import dynamic from "next/dynamic";

import type { StatementEntry } from "@/components/statements/statements-table";
import { mockStatements } from "@/utils/mock";

const StatementsTable = dynamic(
  () => import("@/components/statements/statements-table").then((mod) => mod.StatementsTable),
  {
    // Using a lightweight skeleton improves perceived performance and CLS while the heavy table code loads.
    loading: () => (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-neutral-200" aria-hidden="true" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`summary-skeleton-${index}`}
              className="space-y-2 rounded-lg border border-neutral-200 p-4"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" aria-hidden="true" />
              <div className="h-6 w-32 animate-pulse rounded bg-neutral-200" aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`row-skeleton-${index}`}
              className="h-12 animate-pulse rounded-lg bg-neutral-100"
              aria-hidden="true"
            />
          ))}
        </div>
        <span className="sr-only">Loading statements…</span>
      </div>
    ),
    ssr: false,
  }
);

export const metadata = {
  title: "Statements | SACCO+ Client",
  description: "View your transaction history and statements",
};

// Mock data - replace with actual data fetching from Supabase
// Query should be scoped to user's reference tokens via RLS
async function getStatements(): Promise<StatementEntry[]> {
  // TODO: Fetch allocations scoped by user's reference_token(s)
  // SELECT * FROM allocations WHERE reference_token IN (user's tokens) ORDER BY date DESC
  return mockStatements;
}

export default async function StatementsPage() {
  const statements = await getStatements();

  const handleExportPDF = async (period: string) => {
    "use server";
    // TODO: Generate PDF export server-side
    console.log(`Exporting PDF for period: ${period}`);
    // Use pdfmake or server-side HTML->PDF API
    // Return signed URL for download with watermark "For personal use only"
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-screen-xl px-4 py-6">
          <h1 className="text-2xl font-bold text-neutral-900">My Statements</h1>
          <p className="mt-1 text-sm text-neutral-600">
            View your transaction history and export statements
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 py-6">
        {statements.length === 0 ? (
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
            <p className="mb-2 text-lg text-neutral-600">No statements available</p>
            <p className="text-sm text-neutral-500">
              Make your first contribution to see statements here
            </p>
          </div>
        ) : (
          <StatementsTable entries={statements} onExportPDF={handleExportPDF} />
        )}

        {/* Help Section */}
        <div className="mt-8 rounded-2xl border border-atlas-blue/20 bg-atlas-glow p-6">
          <h2 className="mb-3 text-base font-bold text-atlas-blue-dark">About Your Statements</h2>
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
                <strong>Reference Code:</strong> Each transaction is linked to your unique reference
                code
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>
                <strong>Export PDF:</strong> Download your statements for personal records
                (watermarked)
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
