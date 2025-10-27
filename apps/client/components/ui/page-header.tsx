/**
 * Page Header Component
 * Reusable header component for page titles and descriptions
 * 
 * Features:
 * - Consistent page header styling across the app
 * - Optional description text
 * - Responsive layout
 * - Semantic HTML structure
 * - Accessible heading hierarchy
 * 
 * @accessibility
 * - Uses semantic header and heading elements
 * - Proper heading hierarchy (h1)
 * - High contrast text for readability
 * - Responsive text sizing
 */

interface PageHeaderProps {
  title: string;
  description?: string;
}

/**
 * PageHeader Component
 * Displays a consistent page header with title and optional description
 * 
 * @param props.title - Main page title (displayed as h1)
 * @param props.description - Optional description text
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Savings Groups"
 *   description="Browse and join savings groups in your community"
 * />
 * ```
 */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-gray-600 text-lg max-w-3xl">
            {description}
          </p>
        )}
      </div>
    </header>
  );
}
