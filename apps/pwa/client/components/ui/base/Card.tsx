"use client";

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  interactive?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Card component following Atlas UI design system
 *
 * Features:
 * - Multiple variants for different use cases
 * - Flexible padding options
 * - Hover effects for interactive cards
 * - Composable subcomponents (Header, Content, Footer)
 *
 * Usage:
 * ```tsx
 * <Card hover padding="lg">
 *   <CardHeader title="Title" description="Description" />
 *   <CardContent>Content here</CardContent>
 *   <CardFooter>Footer actions</CardFooter>
 * </Card>
 * ```
 */
export function Card({
  variant = "default",
  padding = "md",
  hover = false,
  interactive = false,
  children,
  className = "",
  ...props
}: CardProps) {
  const baseStyles = "rounded-xl transition-all duration-200";

  const variants = {
    default: "bg-white border border-neutral-200",
    bordered: "bg-white border-2 border-neutral-300",
    elevated: "bg-white shadow-md",
  };

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const hoverStyles = hover ? "hover:shadow-lg hover:border-neutral-300 hover:-translate-y-1" : "";

  const interactiveStyles = interactive
    ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
    : "";

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${interactiveStyles} ${className}`}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader - Semantic header section for cards
 */
export function CardHeader({
  title,
  description,
  action,
  children,
  className = "",
  ...props
}: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {title && <h3 className="text-xl font-bold text-neutral-900 mb-2">{title}</h3>}
            {description && <p className="text-sm text-neutral-700">{description}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * CardContent - Main content section for cards
 */
export function CardContent({ children, className = "", ...props }: CardContentProps) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * CardFooter - Footer section for cards (typically actions)
 */
export function CardFooter({ children, className = "", ...props }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-neutral-200 ${className}`} {...props}>
      {children}
    </div>
  );
}
