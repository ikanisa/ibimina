/**
 * Groups Grid Component
 * Displays groups in a responsive grid layout with metadata
 *
 * Features:
 * - Responsive grid (1-3 columns based on screen size)
 * - Group cards with name, members, and creation date
 * - "Ask to Join" button for each group
 * - Accessible with proper ARIA labels and keyboard navigation
 * - Empty state when no groups available
 */

"use client";

import type { Group } from "@/lib/api/groups";
import { GroupCard } from "./group-card";

interface GroupsGridProps {
  groups: Group[];
}

/**
 * GroupsGrid Component
 * Renders a responsive grid of group cards
 *
 * @param props.groups - Array of groups to display
 *
 * @example
 * ```tsx
 * <GroupsGrid groups={groups} />
 * ```
 *
 * @remarks
 * Uses CSS Grid for responsive layout:
 * - Mobile: 1 column
 * - Tablet: 2 columns
 * - Desktop: 3 columns
 *
 * @accessibility
 * - Uses semantic HTML (section, ul)
 * - Provides descriptive aria-label
 * - Grid items are keyboard navigable via card buttons
 */
export function GroupsGrid({ groups }: GroupsGridProps) {
  // Handle empty state - Atlas redesigned
  if (groups.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-lg font-semibold text-neutral-700 mb-2">No groups available</p>
        <p className="text-sm text-neutral-700">
          Check back later for new savings groups in your area
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Savings groups grid" className="w-full">
      {/* Grid container with responsive columns */}
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {groups.map((group) => (
          <li key={group.id} className="flex">
            <GroupCard group={group} />
          </li>
        ))}
      </ul>

      {/* Results count for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        Showing {groups.length} {groups.length === 1 ? "group" : "groups"}
      </div>
    </section>
  );
}
