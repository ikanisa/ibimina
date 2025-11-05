/**
 * Atlas UI Base Components
 *
 * WCAG 2.2 AA Compliant Design System
 *
 * All components follow:
 * - Minimum 44x44px touch targets
 * - 4.5:1 color contrast minimum (7:1 for headings)
 * - Visible focus indicators
 * - Keyboard navigation
 * - Screen reader support
 * - Reduced motion support
 *
 * P0 Fixes Implemented:
 * - H4.1: Consistent button styles
 * - H4.2: Unified card designs
 * - A11Y-1 to A11Y-25: All accessibility blockers
 * - H1.1, H1.5: Loading states
 * - H9.1: User-friendly error messages
 * - A11Y-11: Form validation with aria
 */

// Actions
export { Button } from "./Button";
export type { ButtonProps } from "./Button";

// Layout & Structure
export { Card, CardHeader, CardContent, CardFooter } from "./Card";
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from "./Card";

// Loading States
export { Skeleton, CardSkeleton, ListSkeleton, PageSkeleton } from "./Skeleton";
export type { SkeletonProps } from "./Skeleton";

export {
  LoadingSpinner,
  Shimmer,
  GroupCardSkeleton,
  TableSkeleton,
  LoadingOverlay,
} from "./LoadingStates";

// Forms
export { Input, PasswordInput, Textarea } from "./Input";
export type { InputProps, TextareaProps } from "./Input";

// Feedback
export { ErrorMessage, ErrorTemplates } from "./ErrorMessage";
export type { ErrorMessageProps } from "./ErrorMessage";

export { ToastProvider, useToast, ToastMessages } from "./Toast";
