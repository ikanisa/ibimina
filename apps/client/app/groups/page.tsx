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
import { PageHeader } from "@/components/ui/page-header";

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
      <PageHeader
        title="Savings Groups"
        description="Browse and join savings groups (Ibimina) in your community"
      />

      {/* Main content area */}
      <main className="container mx-auto px-4 py-8">
        {/* Groups grid component */}
        <GroupsGrid groups={groups} />
      </main>
    </div>
  );
}
