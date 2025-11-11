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
import { GradientHeader } from "@ibimina/ui";
import { fmtCurrency } from "@/utils/format";

export const dynamic = "force-dynamic";

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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 pb-20">
      <div className="mx-auto max-w-screen-xl space-y-6 px-4 py-6">
        <GradientHeader
          title="Payment Instructions"
          subtitle="Use the USSD codes below to make payments via mobile money"
        />

        {/* Empty state */}
        {paySheetEntries.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            role="status"
            aria-live="polite"
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
              <svg
                className="h-10 w-10 text-neutral-400"
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
            </div>
            <p className="mb-2 text-lg font-medium text-neutral-700">
              No payment instructions available
            </p>
            <p className="text-sm text-neutral-700">
              Payment instructions will appear here when you join a group
            </p>
          </div>
        )}

        {/* Pending Payments Section */}
        {pendingPayments.length > 0 && (
          <section aria-labelledby="pending-payments-heading" className="space-y-4">
            <h2 id="pending-payments-heading" className="text-xl font-semibold text-neutral-900">
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
          <section aria-labelledby="completed-payments-heading" className="space-y-4">
            <h2 id="completed-payments-heading" className="text-xl font-semibold text-neutral-900">
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
          <section aria-labelledby="failed-payments-heading" className="space-y-4">
            <h2 id="failed-payments-heading" className="text-xl font-semibold text-neutral-900">
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
            className="mt-8 rounded-2xl border border-atlas-blue/20 bg-atlas-blue/5 p-6"
            role="region"
            aria-label="Payment instructions help"
          >
            <h3 className="mb-3 text-sm font-semibold text-atlas-blue-dark">
              How to pay using USSD
            </h3>
            <ol className="space-y-1 list-decimal list-inside text-sm text-atlas-blue-dark">
              <li>Tap the USSD code on any payment card below</li>
              <li>Your phone will dial the code automatically</li>
              <li>Follow the prompts on your phone to complete the payment</li>
              <li>You&apos;ll receive a confirmation SMS when payment is successful</li>
            </ol>
          </div>
        )}
      </div>
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
  const formattedAmount = fmtCurrency(entry.payment_amount);

  // Format due date if available
  const formattedDueDate = entry.due_date
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(entry.due_date))
    : null;

  // Status badge styling - Atlas design tokens
  const statusStyles = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
    COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    FAILED: "bg-red-100 text-red-800 border-red-200",
  };

  const statusLabels = {
    PENDING: "Pending",
    COMPLETED: "Completed",
    FAILED: "Failed",
  };

  return (
    <article
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-atlas transition-shadow duration-interactive hover:shadow-lg"
      aria-label={`Payment for ${entry.ikimina_name}`}
    >
      {/* Status badge */}
      <div className="mb-4 flex items-start justify-between">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[entry.payment_status]}`}
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
          <dt className="text-xs font-medium uppercase tracking-wide text-neutral-700">Group</dt>
          <dd className="mt-1 text-sm font-semibold text-neutral-900">{entry.ikimina_name}</dd>
        </div>

        {/* SACCO name */}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-neutral-700">SACCO</dt>
          <dd className="mt-1 text-sm text-neutral-900">{entry.sacco_name}</dd>
        </div>

        {/* Payment amount */}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-neutral-700">Amount</dt>
          <dd className="mt-1 text-lg font-bold text-neutral-900">{formattedAmount}</dd>
        </div>

        {/* Due date */}
        {formattedDueDate && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-700">
              Due Date
            </dt>
            <dd className="mt-1 text-sm text-neutral-900">{formattedDueDate}</dd>
          </div>
        )}

        {/* Reference code */}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-neutral-700">
            Reference
          </dt>
          <dd className="mt-1 font-mono text-sm text-neutral-900">{entry.reference_code}</dd>
        </div>

        {/* USSD code - only show for pending payments */}
        {entry.payment_status === "PENDING" && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-700">
              USSD Code
            </dt>
            <dd className="mt-2">
              <a
                href={`tel:${encodeURIComponent(entry.ussd_code)}`}
                className="block w-full rounded-xl bg-atlas-blue px-4 py-3 text-center font-mono text-sm text-white shadow-atlas transition-all duration-interactive hover:bg-atlas-blue-dark focus:ring-4 focus:ring-atlas-blue focus:ring-offset-2"
                aria-label={`Dial USSD code ${entry.ussd_code} to make payment`}
              >
                {entry.ussd_code}
              </a>
              <p className="mt-1 text-center text-xs text-neutral-700">Tap to dial</p>
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}
