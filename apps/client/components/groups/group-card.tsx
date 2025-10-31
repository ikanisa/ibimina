/**
 * Group Card Component
 * Displays a single group with metadata and join button
 *
 * Features:
 * - Group name and code
 * - Total members count
 * - Creation date
 * - SACCO affiliation
 * - "Ask to Join" button with loading state
 * - Integration with join request API
 * - Accessible with proper ARIA labels
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Group } from "@/lib/api/groups";
import { Users, Calendar, Building2 } from "lucide-react";

interface GroupCardProps {
  group: Group;
}

/**
 * GroupCard Component
 * Displays group information in a card layout
 *
 * @param props.group - Group data to display
 *
 * @example
 * ```tsx
 * <GroupCard group={groupData} />
 * ```
 *
 * @accessibility
 * - Uses semantic article element
 * - Descriptive button labels
 * - Icon labels for screen readers
 * - Loading state announced to screen readers
 * - Focus visible styles for keyboard navigation
 * - Error messages announced to assistive technology
 */
export function GroupCard({ group }: GroupCardProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Handle card click to view group details
   */
  const handleCardClick = () => {
    router.push(`/groups/${group.id}/members`);
  };

  /**
   * Handle "Ask to Join" button click
   * Calls the join request API route to submit membership request
   */
  const handleJoinRequest = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent card click when clicking button
    setIsJoining(true);
    setErrorMessage(null);

    try {
      // Call the join request API route
      const response = await fetch(`/api/groups/${group.id}/join-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sacco_id: group.sacco_id,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setHasRequested(true);
        setErrorMessage(null);
      } else {
        setErrorMessage(result.details || result.error || "Failed to submit join request");
      }
    } catch (error) {
      console.error("Error requesting to join group:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

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

  return (
    <article
      onClick={handleCardClick}
      className="flex flex-col w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      aria-label={`${group.name} group details`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Group header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
        <p className="text-sm text-gray-500">Code: {group.code}</p>
      </div>

      {/* Group metadata */}
      <div className="space-y-3 mb-6 flex-grow">
        {/* Members count */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" aria-hidden="true" />
          <span>
            <span className="sr-only">Total members:</span>
            {group.total_members} {group.total_members === 1 ? "member" : "members"}
          </span>
        </div>

        {/* Creation date */}
        {group.created_at && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>
              <span className="sr-only">Created on:</span>
              {formatDate(group.created_at)}
            </span>
          </div>
        )}

        {/* SACCO affiliation */}
        {group.sacco_name && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4" aria-hidden="true" />
            <span>
              <span className="sr-only">SACCO:</span>
              {group.sacco_name}
            </span>
          </div>
        )}

        {/* Group type badge */}
        <div className="pt-2">
          <span
            className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
            role="status"
          >
            {group.type}
          </span>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div
          className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={handleJoinRequest}
        disabled={isJoining || hasRequested}
        className={`
          w-full rounded-md px-4 py-2 text-sm font-medium transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${
            hasRequested
              ? "bg-green-100 text-green-700 cursor-default"
              : isJoining
                ? "bg-gray-100 text-gray-400 cursor-wait"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
          }
        `}
        aria-label={
          hasRequested ? `Join request sent for ${group.name}` : `Ask to join ${group.name}`
        }
        aria-live="polite"
      >
        {hasRequested ? "Request Sent ✓" : isJoining ? "Sending..." : "Ask to Join"}
      </button>
    </article>
  );
}
