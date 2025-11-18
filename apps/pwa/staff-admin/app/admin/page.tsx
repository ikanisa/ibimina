import Link from "next/link";

export default function AdminGovernanceIndex() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Keep admin work focused</h2>
        <p className="text-sm text-gray-600">
          The admin console now highlights the most essential tasks so it stays simple to navigate
          and easy to maintain.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-base font-semibold text-gray-900">Staff invites</h3>
          <p className="text-sm text-gray-600">
            Send invitations for SACCO team members and track their status in one place.
          </p>
          <Link
            className="inline-flex items-center text-sm font-semibold text-gray-900 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            href="/admin/invites"
          >
            Go to invites
          </Link>
        </article>

        <article className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-base font-semibold text-gray-900">Governance at a glance</h3>
          <p className="text-sm text-gray-600">
            Keep ownership clear and audit-ready. Future configuration modules will return here once
            they are required.
          </p>
          <span className="inline-flex items-center text-sm font-medium text-gray-600">
            Core controls are active; optional modules were removed.
          </span>
        </article>
      </div>
    </div>
  );
}
