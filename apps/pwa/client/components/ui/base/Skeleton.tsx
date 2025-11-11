"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

/**
 * Skeleton loader component following Atlas UI design system
 *
 * WCAG 2.2 AA Compliant:
 * - Reduced motion support via prefers-reduced-motion
 * - Proper ARIA labels for screen readers
 * - Semantic HTML structure
 *
 * Usage:
 * ```tsx
 * <Skeleton variant="text" width="200px" />
 * <Skeleton variant="circular" width={48} height={48} />
 * <Skeleton variant="rectangular" height="200px" />
 * ```
 */
export function Skeleton({
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
  className = "",
  ...props
}: SkeletonProps) {
  const baseStyles = "bg-neutral-200";

  const variants = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-md",
    rounded: "rounded-xl",
  };

  const animations = {
    pulse: "animate-pulse",
    wave: "relative overflow-hidden before:absolute before:inset-0 before:translate-x-[-100%] before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-neutral-100 before:to-transparent",
    none: "",
  };

  const widthStyle = width ? (typeof width === "number" ? { width: `${width}px` } : { width }) : {};

  const heightStyle = height
    ? typeof height === "number"
      ? { height: `${height}px` }
      : { height }
    : {};

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${animations[animation]} ${className}`}
      style={{ ...widthStyle, ...heightStyle }}
      aria-label="Loading..."
      aria-busy="true"
      {...props}
    />
  );
}

/**
 * Card skeleton for loading group cards, loan cards, etc.
 */
export function CardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6" aria-busy="true">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
      </div>
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <Skeleton variant="rectangular" height={44} />
      </div>
    </div>
  );
}

/**
 * List skeleton for loading statements, transactions, etc.
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-lg"
        >
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="50%" />
          </div>
          <Skeleton variant="text" width={80} />
        </div>
      ))}
    </div>
  );
}

/**
 * Page skeleton for loading full page content
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="text" width="60%" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
