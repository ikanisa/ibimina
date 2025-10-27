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
    limit: 100 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header with title and description */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl font-semibold text-gray-900">Savings Groups</h1>
          <p className="mt-2 text-base text-gray-600">
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
