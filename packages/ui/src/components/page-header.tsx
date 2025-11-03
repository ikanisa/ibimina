import type { ReactNode } from "react";

import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Array<{
    label: ReactNode;
    href?: string;
    onClick?: () => void;
    "aria-label"?: string;
  }>;
  actions?: ReactNode;
  metadata?: ReactNode;
  className?: string;
  subdued?: boolean;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  metadata,
  className,
  subdued = false,
}: PageHeaderProps) {
  return (
    <header
      style={{
        padding: designTokens.spacing[6],
        gap: designTokens.spacing[4],
        borderRadius: designTokens.borderRadius.lg,
        border: `${designTokens.borderWidth.default} solid ${subdued ? 'transparent' : designTokens.colors.border.default}`,
        backgroundColor: subdued ? 'transparent' : 'white',
        boxShadow: subdued ? 'none' : designTokens.shadow.base,
      }}
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-white p-6 text-neutral-900 shadow-sm",
        subdued && "border-dashed bg-transparent shadow-none",
        className
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="text-xs font-medium uppercase tracking-wide text-neutral-600">
          <ol className="flex flex-wrap items-center gap-2">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const element = item.href ? (
                <a
                  key={index}
                  href={item.href}
                  onClick={item.onClick}
                  aria-label={item["aria-label"]}
                  className={cn(
                    "rounded-full border border-transparent px-3 py-1 transition-colors",
                    isLast
                      ? "border-neutral-300 bg-neutral-100 text-neutral-900"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                  )}
                >
                  {item.label}
                </a>
              ) : (
                <span
                  key={index}
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "rounded-full border px-3 py-1",
                    isLast
                      ? "border-neutral-300 bg-neutral-100 text-neutral-900"
                      : "border-neutral-200 text-neutral-600"
                  )}
                >
                  {item.label}
                </span>
              );
              return element;
            })}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1
            className="text-2xl font-semibold sm:text-3xl"
            style={{
              fontSize: designTokens.typography.fontSize["2xl"],
              fontWeight: designTokens.typography.fontWeight.semibold,
              color: designTokens.colors.text.primary,
            }}
          >
            {title}
          </h1>
          {description ? (
            <p
              className="max-w-3xl text-sm leading-relaxed"
              style={{
                fontSize: designTokens.typography.fontSize.sm,
                color: designTokens.colors.text.secondary,
              }}
            >
              {description}
            </p>
          ) : null}
          {metadata ? (
            <div
              className="text-xs"
              style={{
                fontSize: designTokens.typography.fontSize.xs,
                color: designTokens.colors.text.tertiary,
              }}
            >
              {metadata}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
