/**
 * Group Members Page
 *
 * Displays the list of members for a specific group (Ikimina).
 * Access is restricted - only group members can view this page.
 *
 * Features:
 * - Client-side data fetching via API routes
 * - Displays member information with masked sensitive data
 * - Error handling for unauthorized access
 * - Accessibility-compliant UI following WCAG 2.1 AA standards
 * - Responsive table layout
 * - Semantic HTML structure
 *
 * URL: /groups/[id]/members
 *
 * Security:
 * - Client Component that fetches data from authenticated API route
 * - RLS policies enforce member-only access at the database level
 * - Masked phone numbers and national IDs
 *
 * @accessibility
 * - Semantic HTML (table, thead, tbody, th, td)
 * - Proper heading hierarchy
 * - ARIA labels for screen readers
 * - Keyboard navigable
 * - High contrast text
 * - Responsive layout
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, Calendar, Shield, ArrowLeft, AlertCircle } from "lucide-react";

/**
 * Member data interface
 */
interface Member {
  id: string;
  member_code: string;
  full_name: string;
  status: string;
  joined_at: string;
  msisdn?: string;
  national_id?: string;
}

/**
 * API response interface
 */
interface MembersResponse {
  success: boolean;
  error?: string;
  details?: string;
  data?: {
    group: {
      id: string;
      name: string;
    };
    members: Member[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      has_more: boolean;
    };
  };
}

/**
 * GroupMembersPage Component
 * Client Component that fetches and displays group members
 */
export default function GroupMembersPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [membersData, setMembersData] = useState<MembersResponse["data"] | null>(null);

  /**
   * Fetch group members on component mount
   */
  useEffect(() => {
    async function fetchMembers() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/groups/${groupId}/members`);
        const data: MembersResponse = await response.json();

        if (!response.ok) {
          setError(data.details || data.error || "Failed to load members");
          return;
        }

        if (data.success && data.data) {
          setMembersData(data.data);
        } else {
          setError("Failed to load members");
        }
      } catch (err) {
        console.error("Error fetching members:", err);
        setError("An unexpected error occurred while loading members");
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, [groupId]);

  /**
   * Format date for display
   * @param dateString - ISO date string
   * @returns Formatted date (e.g., "Jan 15, 2024")
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    router.push("/groups");
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Page header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-neutral-700 transition-colors duration-interactive hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-atlas-blue/30"
              aria-label="Back to groups"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-medium">Back to Groups</span>
            </button>
          </div>

          {membersData && (
            <div className="mt-4">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
                <Users className="h-6 w-6" aria-hidden="true" />
                {membersData.group.name} - Members
              </h1>
              <p className="mt-2 text-sm text-neutral-700">
                Total members: {membersData.pagination.total}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-atlas-blue"></div>
              <p className="text-neutral-700">Loading members...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-6"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <h2 className="mb-1 text-lg font-semibold text-red-900">Unable to Load Members</h2>
              <p className="text-red-700">{error}</p>
              {error.includes("permission") && (
                <p className="mt-2 text-sm text-red-600">
                  You must be a member of this group to view its members list.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Members table */}
        {membersData && !loading && !error && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-atlas">
            {membersData.members.length === 0 ? (
              <div className="py-16 text-center" role="status">
                <Users className="mx-auto mb-4 h-12 w-12 text-neutral-400" aria-hidden="true" />
                <p className="text-lg text-neutral-700">No members found</p>
                <p className="mt-2 text-sm text-neutral-700">
                  This group doesn&apos;t have any active members yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700"
                      >
                        Member Code
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700"
                      >
                        Full Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700"
                      >
                        Joined Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700"
                      >
                        Contact
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {membersData.members.map((member) => (
                      <tr
                        key={member.id}
                        className="transition-colors duration-interactive hover:bg-neutral-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">
                          {member.member_code}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">
                          {member.full_name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              member.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-neutral-100 text-neutral-800"
                            }`}
                            role="status"
                          >
                            <Shield className="mr-1 h-3 w-3" aria-hidden="true" />
                            {member.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" aria-hidden="true" />
                            <time dateTime={member.joined_at}>{formatDate(member.joined_at)}</time>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">
                          {member.msisdn || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination info */}
            {membersData.members.length > 0 && (
              <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4">
                <p className="text-sm text-neutral-700">
                  Showing {membersData.pagination.offset + 1} to{" "}
                  {Math.min(
                    membersData.pagination.offset + membersData.pagination.limit,
                    membersData.pagination.total
                  )}{" "}
                  of {membersData.pagination.total} members
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
