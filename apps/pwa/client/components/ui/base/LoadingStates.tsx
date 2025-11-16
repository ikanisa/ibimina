"use client";

import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Loading States Components
 *
 * P0 Fixes:
 * - H1.1: No loading states on data fetch
 * - H1.5: No loading indicators (Mobile)
 * - A11Y-10: Loading states not announced
 *
 * WCAG 2.2 Compliant:
 * - Uses aria-live="polite" for announcements
 * - Provides meaningful loading messages
 * - Animated shimmer respects prefers-reduced-motion
 */

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

interface PageLoadingStateProps {
  title?: string;
  description?: string;
  showSkeletons?: boolean;
}

/**
 * LoadingSpinner - Simple spinner with optional message
 */
export function LoadingSpinner({
  message = "Loading...",
  size = "md",
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const spinnerSize = sizes[size];

  const content = (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 size={spinnerSize} className="text-brand-blue animate-spin" aria-hidden="true" />
      <span className="text-sm text-neutral-700">{message}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-neutral-50 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return <div className="py-12">{content}</div>;
}

/**
 * PageLoadingState - Accessible page-level loading layout
 * Provides distinct copy and skeletons to help users understand what is loading.
 */
export function PageLoadingState({
  title = "Loading your dashboard",
  description = "We’re getting your balances, groups, and recent activity ready.",
  showSkeletons = true,
}: PageLoadingStateProps) {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6" aria-busy="true" aria-live="polite">
      <div className="mb-6 space-y-2" role="status">
        <p className="text-sm font-semibold text-neutral-800">{title}</p>
        <p className="text-sm text-neutral-600">{description}</p>
      </div>

      {showSkeletons ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`quick-action-${i}`} className="h-24 rounded-xl" />
            ))}
          </div>

          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={`card-${i}`} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Skeleton - Animated loading placeholder
 * Provides visual structure while content loads
 */
interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className = "", variant = "rectangular" }: SkeletonProps) {
  const variants = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={`bg-neutral-200 animate-pulse ${variants[variant]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Shimmer - Smooth loading animation
 * Uses CSS shimmer effect that respects reduced-motion
 */
interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className = "" }: ShimmerProps) {
  return (
    <div
      className={`relative overflow-hidden bg-neutral-100 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div className="absolute inset-0 shimmer-effect" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * CardSkeleton - Skeleton for card layouts
 */
export function CardSkeleton() {
  return (
    <div
      className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4"
      role="status"
      aria-label="Loading card"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8" variant="circular" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

/**
 * GroupCardSkeleton - Specific skeleton for group cards
 */
export function GroupCardSkeleton() {
  return (
    <div
      className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4"
      role="status"
      aria-label="Loading group information"
    >
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12" variant="circular" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-10 w-full" />
      <span className="sr-only">Loading group details...</span>
    </div>
  );
}

/**
 * TableSkeleton - Skeleton for table rows
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading table data...</span>
    </div>
  );
}

/**
 * LoadingOverlay - Full-screen overlay with spinner
 * Use for blocking operations
 */
interface LoadingOverlayProps {
  message?: string;
  isOpen: boolean;
}

export function LoadingOverlay({ message = "Processing...", isOpen }: LoadingOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
    >
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm mx-4">
        <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
          <Loader2 size={32} className="text-brand-blue animate-spin" aria-hidden="true" />
          <p id="loading-title" className="text-lg font-semibold text-neutral-900">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
