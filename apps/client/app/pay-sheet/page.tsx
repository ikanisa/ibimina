/**
 * USSD Pay Sheet Page
 * Displays payment instructions with USSD codes for member contributions
 *
 * This page provides:
 * - List of pending and completed payments
 * - USSD codes for mobile money payments
 * - Payment amounts and due dates
 * - Payment status tracking
 * - Accessibility-compliant UI following WCAG 2.1 AA standards
 *
 * Features:
 * - Tap-to-dial USSD codes for quick payment
 * - Clear status indicators with color and text
 * - Responsive card layout
 * - Screen reader friendly content
 */

import { getUssdPaySheet, type UssdPaySheetEntry } from "@/lib/api/ussd-pay-sheet";

export const metadata = {
  title: "Pay Sheet | SACCO+ Client",
  description: "View your payment instructions and USSD codes for group contributions",
};

/**
 * Pay Sheet Page Component
 * Server Component that fetches USSD pay sheet data and renders the UI
 */
export default async function PaySheetPage() {
  // Fetch pay sheet data - show pending payments first
  let paySheetEntries: UssdPaySheetEntry[];
  try {
    paySheetEntries = await getUssdPaySheet({
      limit: 50,
    });
  } catch (error) {
    // Handle authentication or other errors gracefully
    console.error("Error fetching pay sheet:", error);
    paySheetEntries = [];
  }

  // Separate pending and completed payments for better UX
  const pendingPayments = paySheetEntries.filter((entry) => entry.payment_status === "PENDING");
  const completedPayments = paySheetEntries.filter((entry) => entry.payment_status === "COMPLETED");
  const failedPayments = paySheetEntries.filter((entry) => entry.payment_status === "FAILED");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Payment Instructions</h1>
          <p className="mt-1 text-sm text-gray-600">
            Use the USSD codes below to make payments via mobile money
          </p>
        </div>
      </header>

      {/* Main content area */}
      <main className="container mx-auto px-4 py-8">
        {/* Empty state */}
        {paySheetEntries.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            role="status"
            aria-live="polite"
          >
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
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
            <p className="text-lg text-gray-600 mb-2">No payment instructions available</p>
            <p className="text-sm text-gray-500">
              Payment instructions will appear here when you join a group
            </p>
          </div>
        )}

        {/* Pending Payments Section */}
        {pendingPayments.length > 0 && (
          <section aria-labelledby="pending-payments-heading" className="mb-8">
            <h2 id="pending-payments-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Pending Payments ({pendingPayments.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingPayments.map((entry) => (
                <PaymentCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )}

        {/* Completed Payments Section */}
        {completedPayments.length > 0 && (
          <section aria-labelledby="completed-payments-heading" className="mb-8">
            <h2
              id="completed-payments-heading"
              className="text-xl font-semibold text-gray-900 mb-4"
            >
              Completed Payments ({completedPayments.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedPayments.map((entry) => (
                <PaymentCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )}

        {/* Failed Payments Section */}
        {failedPayments.length > 0 && (
          <section aria-labelledby="failed-payments-heading" className="mb-8">
            <h2 id="failed-payments-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Failed Payments ({failedPayments.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {failedPayments.map((entry) => (
                <PaymentCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )}

        {/* Help text */}
        {paySheetEntries.length > 0 && (
          <div
            className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            role="region"
            aria-label="Payment instructions help"
          >
            <h3 className="text-sm font-semibold text-blue-900 mb-2">How to pay using USSD</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Tap the USSD code on any payment card below</li>
              <li>Your phone will dial the code automatically</li>
              <li>Follow the prompts on your phone to complete the payment</li>
              <li>You&apos;ll receive a confirmation SMS when payment is successful</li>
            </ol>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Payment Card Component
 * Displays a single payment instruction with USSD code
 *
 * @param props.entry - USSD pay sheet entry data
 *
 * @accessibility
 * - Uses semantic HTML (article, dl, dt, dd)
 * - Provides descriptive aria-labels
 * - Status badges use both color and text
 * - USSD code is clickable with proper href
 * - All interactive elements have focus states
 */
interface PaymentCardProps {
  entry: {
    id: string;
    member_name: string;
    ussd_code: string;
    payment_amount: number;
    payment_status: "PENDING" | "COMPLETED" | "FAILED";
    ikimina_name: string;
    sacco_name: string;
    reference_code: string;
    due_date: string | null;
  };
}

function PaymentCard({ entry }: PaymentCardProps) {
  // Format amount with RWF currency
  const formattedAmount = new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
  }).format(entry.payment_amount);

  // Format due date if available
  const formattedDueDate = entry.due_date
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(entry.due_date))
    : null;

  // Status badge styling
  const statusStyles = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    FAILED: "bg-red-100 text-red-800 border-red-200",
  };

  const statusLabels = {
    PENDING: "Pending",
    COMPLETED: "Completed",
    FAILED: "Failed",
  };

  return (
    <article
      className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
      aria-label={`Payment for ${entry.ikimina_name}`}
    >
      {/* Status badge */}
      <div className="flex items-start justify-between mb-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[entry.payment_status]}`}
          role="status"
          aria-label={`Payment status: ${statusLabels[entry.payment_status]}`}
        >
          {statusLabels[entry.payment_status]}
        </span>
      </div>

      {/* Payment details */}
      <dl className="space-y-3">
        {/* Group name */}
        <div>
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Group</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900">{entry.ikimina_name}</dd>
        </div>

        {/* SACCO name */}
        <div>
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">SACCO</dt>
          <dd className="mt-1 text-sm text-gray-900">{entry.sacco_name}</dd>
        </div>

        {/* Payment amount */}
        <div>
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">{formattedAmount}</dd>
        </div>

        {/* Due date */}
        {formattedDueDate && (
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{formattedDueDate}</dd>
          </div>
        )}

        {/* Reference code */}
        <div>
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reference</dt>
          <dd className="mt-1 text-sm text-gray-900 font-mono">{entry.reference_code}</dd>
        </div>

        {/* USSD code - only show for pending payments */}
        {entry.payment_status === "PENDING" && (
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">USSD Code</dt>
            <dd className="mt-2">
              <a
                href={`tel:${encodeURIComponent(entry.ussd_code)}`}
                className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white text-center font-mono text-sm rounded-lg transition-colors"
                aria-label={`Dial USSD code ${entry.ussd_code} to make payment`}
              >
                {entry.ussd_code}
              </a>
              <p className="mt-1 text-xs text-gray-500 text-center">Tap to dial</p>
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}
