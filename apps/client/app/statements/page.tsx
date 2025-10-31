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

import { StatementsTable, type StatementEntry } from "@/components/statements/statements-table";

export const metadata = {
  title: "Statements | SACCO+ Client",
  description: "View your transaction history and statements",
};

// Mock data - replace with actual data fetching from Supabase
// Query should be scoped to user's reference tokens via RLS
async function getStatements(): Promise<StatementEntry[]> {
  // TODO: Fetch allocations scoped by user's reference_token(s)
  // SELECT * FROM allocations WHERE reference_token IN (user's tokens) ORDER BY date DESC
  return [
    {
      id: "1",
      date: "2025-10-25T10:30:00Z",
      amount: 20000,
      txnId: "MTN12345",
      status: "CONFIRMED",
      groupName: "Kigali Business Group",
      reference: "NYA.GAS.KBG.001",
    },
    {
      id: "2",
      date: "2025-10-20T14:15:00Z",
      amount: 15000,
      txnId: "MTN67890",
      status: "CONFIRMED",
      groupName: "Farmers Cooperative",
      reference: "NYA.KIC.FRM.002",
    },
    {
      id: "3",
      date: "2025-10-28T09:00:00Z",
      amount: 25000,
      txnId: "PENDING",
      status: "PENDING",
      groupName: "Kigali Business Group",
      reference: "NYA.GAS.KBG.001",
    },
    {
      id: "4",
      date: "2025-10-15T11:45:00Z",
      amount: 18000,
      txnId: "MTN11223",
      status: "CONFIRMED",
      groupName: "Farmers Cooperative",
      reference: "NYA.KIC.FRM.002",
    },
    {
      id: "5",
      date: "2025-10-10T16:20:00Z",
      amount: 20000,
      txnId: "MTN44556",
      status: "CONFIRMED",
      groupName: "Kigali Business Group",
      reference: "NYA.GAS.KBG.001",
    },
    {
      id: "6",
      date: "2025-09-28T13:30:00Z",
      amount: 15000,
      txnId: "MTN77889",
      status: "CONFIRMED",
      groupName: "Farmers Cooperative",
      reference: "NYA.KIC.FRM.002",
    },
    {
      id: "7",
      date: "2025-09-20T10:00:00Z",
      amount: 20000,
      txnId: "MTN99001",
      status: "CONFIRMED",
      groupName: "Kigali Business Group",
      reference: "NYA.GAS.KBG.001",
    },
  ];
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">My Statements</h1>
          <p className="text-sm text-gray-600 mt-1">
            View your transaction history and export statements
          </p>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {statements.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
            <p className="text-lg text-gray-600 mb-2">No statements available</p>
            <p className="text-sm text-gray-500">
              Make your first contribution to see statements here
            </p>
          </div>
        ) : (
          <StatementsTable entries={statements} onExportPDF={handleExportPDF} />
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-base font-bold text-blue-900 mb-3">About Your Statements</h2>
          <ul className="space-y-2 text-sm text-blue-800">
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
