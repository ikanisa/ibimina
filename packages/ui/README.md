# Shared UI Components

This document provides an overview of the shared UI components available in the
`@ibimina/ui` package.

## Core Components

### PageHeader

A consistent header component for pages with title, description, actions, and
optional breadcrumbs.

```tsx
import { PageHeader } from "@ibimina/ui";

<PageHeader
  title="Partners"
  description="Manage partner organizations"
  actions={<button>Add Partner</button>}
  breadcrumbs={<nav>Home / Partners</nav>}
/>;
```

**Props:**

- `title`: ReactNode - Page title (required)
- `description`: ReactNode - Optional page description
- `actions`: ReactNode - Optional action buttons
- `breadcrumbs`: ReactNode - Optional breadcrumb navigation
- `className`: string - Additional CSS classes

### Modal

A centered dialog overlay component with backdrop, animations, and accessibility
features.

```tsx
import { Modal } from "@ibimina/ui";

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
  footer={<button onClick={handleSave}>Save</button>}
>
  Modal content here
</Modal>;
```

**Props:**

- `isOpen`: boolean - Controls modal visibility (required)
- `onClose`: () => void - Close handler (required)
- `children`: ReactNode - Modal content (required)
- `title`: ReactNode - Modal title
- `description`: ReactNode - Modal description
- `size`: "sm" | "md" | "lg" | "xl" | "full" - Modal width
- `footer`: ReactNode - Optional footer content
- `closeOnEscape`: boolean - Close on Escape key (default: true)
- `closeOnOverlayClick`: boolean - Close on backdrop click (default: true)
- `showCloseButton`: boolean - Show X button (default: true)

### Drawer

A slide-in panel component from left or right with animations and accessibility.

```tsx
import { Drawer } from "@ibimina/ui";

<Drawer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Settings"
  side="right"
  size="md"
>
  Drawer content here
</Drawer>;
```

**Props:**

- `isOpen`: boolean - Controls drawer visibility (required)
- `onClose`: () => void - Close handler (required)
- `children`: ReactNode - Drawer content (required)
- `title`: ReactNode - Drawer title
- `description`: ReactNode - Drawer description
- `side`: "left" | "right" - Slide direction (default: "right")
- `size`: "sm" | "md" | "lg" | "xl" - Drawer width
- `footer`: ReactNode - Optional footer content
- `closeOnEscape`: boolean - Close on Escape key (default: true)
- `closeOnOverlayClick`: boolean - Close on backdrop click (default: true)
- `showCloseButton`: boolean - Show X button (default: true)

### EmptyState

A component for displaying empty states with icon, title, description, and
optional action.

```tsx
import { EmptyState } from "@ibimina/ui";
import { Inbox } from "lucide-react";

<EmptyState
  title="No messages"
  description="Your inbox is empty"
  icon={<Inbox className="h-6 w-6" />}
  action={<button>Compose</button>}
/>;
```

**Props:**

- `title`: ReactNode - Empty state title (required)
- `description`: ReactNode - Optional description
- `icon`: ReactNode - Optional icon
- `action`: ReactNode - Optional call-to-action
- `className`: string - Additional CSS classes

### ErrorState

A component for displaying error states with variants, error details, and retry
action.

```tsx
import { ErrorState } from "@ibimina/ui";

<ErrorState
  title="Failed to load data"
  description="An error occurred while fetching the data"
  error={error}
  variant="default"
  onRetry={() => fetchData()}
/>;
```

**Props:**

- `title`: ReactNode - Error title (required)
- `description`: ReactNode - Optional error description
- `error`: Error | string - Optional error details
- `variant`: "default" | "offline" | "critical" - Visual style
- `icon`: ReactNode - Optional custom icon
- `action`: ReactNode - Optional custom action
- `onRetry`: () => void - Optional retry handler
- `className`: string - Additional CSS classes

### Skeleton

A loading placeholder component with shimmer animation.

```tsx
import { Skeleton } from "@ibimina/ui";

<Skeleton className="h-20 w-full rounded-xl" />;
```

## Form Components

### FormLayout

A layout component for forms with single or two-column grid support.

```tsx
import { FormLayout } from "@ibimina/ui";

<FormLayout columns={2}>{/* Form fields */}</FormLayout>;
```

**Props:**

- `children`: ReactNode - Form fields (required)
- `columns`: 1 | 2 - Number of columns (default: 1)
- `className`: string - Additional CSS classes

### FormField

A wrapper for form inputs with label, hint, error, and validation.

```tsx
import { FormField } from "@ibimina/ui";

<FormField
  label="Email"
  required
  error={errors.email}
  hint="We'll never share your email"
>
  <input type="email" />
</FormField>;
```

**Props:**

- `label`: ReactNode - Field label (required)
- `children`: ReactNode - Input element (required)
- `error`: string - Validation error message
- `hint`: string - Help text
- `required`: boolean - Show required indicator
- `fullWidth`: boolean - Span both columns in 2-column layout
- `className`: string - Additional CSS classes

### ValidationBanner

A banner for displaying form-level validation messages.

```tsx
import { ValidationBanner } from "@ibimina/ui";

<ValidationBanner
  variant="error"
  title="Form has errors"
  message="Please fix the errors below"
  errors={["Email is required", "Password is too short"]}
/>;
```

**Props:**

- `variant`: "error" | "warning" | "info" | "success" - Visual style (required)
- `message`: ReactNode - Main message (required)
- `title`: ReactNode - Optional title
- `errors`: string[] - Optional error list
- `onDismiss`: () => void - Optional dismiss handler
- `className`: string - Additional CSS classes

### StepperForm

A multi-step form component with visual progress indicator.

```tsx
import { StepperForm, StepperFormActions } from "@ibimina/ui";

const steps = [
  { id: "personal", title: "Personal Info", description: "Basic details" },
  { id: "address", title: "Address", description: "Contact info" },
  { id: "review", title: "Review", description: "Confirm details" },
];

<StepperForm steps={steps} currentStep={currentStep}>
  {/* Step content */}

  <StepperFormActions
    isFirstStep={currentStep === 1}
    isLastStep={currentStep === steps.length}
    onBack={() => setCurrentStep((prev) => prev - 1)}
    onNext={() => setCurrentStep((prev) => prev + 1)}
    onSubmit={handleSubmit}
    isSubmitting={isSubmitting}
  />
</StepperForm>;
```

**StepperForm Props:**

- `steps`: StepConfig[] - Step configuration (required)
- `currentStep`: number - Current step number (1-indexed) (required)
- `children`: ReactNode - Step content (required)
- `onStepChange`: (step: number) => void - Step change handler
- `allowSkipToCompleted`: boolean - Allow navigation to completed steps
- `className`: string - Additional CSS classes

**StepperFormActions Props:**

- `onBack`: () => void - Back button handler
- `onNext`: () => void - Next button handler
- `onSubmit`: () => void - Submit button handler
- `isFirstStep`: boolean - Hide back button
- `isLastStep`: boolean - Show submit instead of next
- `isNextDisabled`: boolean - Disable next button
- `isSubmitting`: boolean - Loading state
- `nextLabel`: string - Custom next button label
- `backLabel`: string - Custom back button label
- `submitLabel`: string - Custom submit button label
- `className`: string - Additional CSS classes

### ReviewStep

A component for displaying a review/confirmation step with organized sections.

```tsx
import { ReviewStep } from "@ibimina/ui";

const sections = [
  {
    title: "Personal Information",
    items: [
      { label: "Name", value: "John Doe" },
      { label: "Email", value: "john@example.com", highlight: true },
    ],
    onEdit: () => goToStep(1),
  },
];

<ReviewStep title="Review your information" sections={sections} />;
```

**Props:**

- `sections`: ReviewSection[] - Sections to display (required)
- `title`: string - Optional title
- `className`: string - Additional CSS classes

**ReviewSection:**

- `title`: string - Section title
- `items`: ReviewItem[] - Items in section
- `onEdit`: () => void - Optional edit handler

**ReviewItem:**

- `label`: string - Item label
- `value`: ReactNode - Item value
- `highlight`: boolean - Highlight this item

## Design Tokens

All components use consistent design tokens from the theme:

- **Spacing**: Based on 4px grid
- **Border Radius**: xs (8px), sm (12px), md (16px), lg (24px), xl (32px)
- **Shadows**: glass, subtle, atlas, atlas-lg
- **Colors**: Uses the Atlas-inspired color palette

## Accessibility

All components follow accessibility best practices:

- Proper ARIA attributes (role, aria-label, aria-describedby, etc.)
- Keyboard navigation support
- Focus management
- Screen reader announcements
- Color contrast compliance

## Usage Examples

See the `apps/admin` directory for real-world usage examples:

- `components/admin/staff/add-staff-drawer.tsx` - Drawer component
- `app/(main)/partners/page.tsx` - PageHeader, ErrorState, EmptyState
- `app/(main)/countries/page.tsx` - PageHeader, ErrorState, EmptyState
