import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  className?: string;
}

/**
 * PageHeader - A consistent header component for pages
 *
 * Features:
 * - Title and optional description
 * - Action buttons area
 * - Optional breadcrumbs
 * - Responsive layout
 * - Uses design tokens for spacing and typography
 * - ARIA landmarks for accessibility
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent pb-6",
        className
      )}
      role="banner"
    >
      {breadcrumbs && (
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-400">
          {breadcrumbs}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-0">{title}</h1>
          {description && <p className="text-base text-neutral-300 max-w-2xl">{description}</p>}
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
