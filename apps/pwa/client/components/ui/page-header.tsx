/**
 * Page Header Component
 * Displays a consistent header across pages with title and description
 *
 * Features:
 * - Semantic HTML structure
 * - Responsive text sizing
 * - Accessible heading hierarchy
 * - Consistent styling across pages
 */

interface PageHeaderProps {
  title: string;
  description?: string;
}

/**
 * PageHeader Component
 * Renders a page title and optional description
 *
 * @param props.title - Main page title
 * @param props.description - Optional description text
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Groups"
 *   description="Browse and join savings groups"
 * />
 * ```
 *
 * @accessibility
 * - Uses h1 for page title (proper heading hierarchy)
 * - Semantic header element
 * - Descriptive text for screen readers
 */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      </div>
    </header>
  );
}
