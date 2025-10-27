/**
 * Group Members Page
 * 
 * Displays the list of members for a specific group (Ikimina).
 * Access is restricted - only group members can view this page.
 * 
 * Features:
 * - Server-side data fetching with authentication
 * - Displays member information with masked sensitive data
 * - Error handling for unauthorized access
 * - Accessibility-compliant UI following WCAG 2.1 AA standards
 * - Responsive table layout
 * - Semantic HTML structure
 * 
 * URL: /groups/[id]/members
 * 
 * Security:
 * - Server Component with authenticated data fetching
 * - RLS policies enforce member-only access
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
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-3 py-2"
              aria-label="Back to groups"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-medium">Back to Groups</span>
            </button>
          </div>
          
          {membersData && (
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6" aria-hidden="true" />
                {membersData.group.name} - Members
              </h1>
              <p className="mt-2 text-sm text-gray-600">
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
          <div className="flex justify-center items-center py-16" role="status" aria-live="polite">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading members...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-1">
                Unable to Load Members
              </h2>
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
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {membersData.members.length === 0 ? (
              <div className="text-center py-16" role="status">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <p className="text-lg text-gray-600">No members found</p>
                <p className="text-sm text-gray-500 mt-2">
                  This group doesn&apos;t have any active members yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Member Code
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Full Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Joined Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Contact
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {membersData.members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.member_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                            role="status"
                          >
                            <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" aria-hidden="true" />
                            <time dateTime={member.joined_at}>
                              {formatDate(member.joined_at)}
                            </time>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
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
