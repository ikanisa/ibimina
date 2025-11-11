/**
 * Groups Page
 * Displays a grid of groups (Ibimina) with metadata and join functionality
 *
 * This page provides:
 * - Grid view of all active groups
 * - Group metadata: name, total members, creation date
 * - "Ask to Join" button for each group
 * - Accessibility-compliant UI following WCAG 2.1 AA standards
 */

import { getGroups } from "@/lib/api/groups";
import { GroupsGrid } from "@/components/groups/groups-grid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Groups | Ibimina Client",
  description: "Browse and join savings groups (Ibimina)",
};

/**
 * Groups Page Component
 * Server Component that fetches groups and renders the grid
 */
export default async function GroupsPage() {
  // Fetch groups with metadata - filter for active groups only
  const groups = await getGroups({
    status: "ACTIVE",
    limit: 100,
  });

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Page header with title and description - Atlas redesigned */}
      <header className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Savings Groups</h1>
          <p className="mt-2 text-base text-neutral-700">
            Browse and join savings groups (Ibimina) in your community
          </p>
        </div>
      </header>

      {/* Main content area */}
      <main className="container mx-auto px-4 py-8">
        {/* Groups grid component */}
        <GroupsGrid groups={groups} />
      </main>
    </div>
  );
}
