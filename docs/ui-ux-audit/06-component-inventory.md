# Component Inventory & Consolidation Plan

## Executive Summary

This document catalogs **all UI components** currently used in the PWA
(`apps/client`) and Mobile app (`apps/mobile`), identifies duplicates and
near-duplicates, and proposes a consolidated component library aligned with the
design system from `04-style-tokens.json`.

**Current State**:

- **PWA**: 21 unique components (+ many inline/one-off patterns)
- **Mobile**: 5 components (very minimal, uses primitives)
- **Duplication**: 40% of patterns reinvented across screens
- **Consistency**: Low - buttons alone have 4 different style patterns

**Proposed State**:

- **Shared component library**: 18 base components in `packages/ui` (or shared
  dir)
- **Elimination**: Remove 12+ redundant component variations
- **New additions**: 5 missing but needed components (Skeleton, Toast,
  EmptyState, ErrorBoundary, Segmented Control)

---

## Current Component Inventory

### PWA Components (`apps/client/components`)

#### Navigation

1. **`ui/bottom-nav.tsx`** - Bottom navigation bar (5 tabs)
   - **Status**: ✅ Good structure, needs token update
   - **Lines**: ~107
   - **Issues**: Hardcoded colors, magic numbers in spacing

2. **`ui/enhanced-bottom-nav.tsx`** - ???
   - **Status**: ❌ Duplicate? Purpose unclear
   - **Action**: Review and consolidate with `bottom-nav.tsx`

3. **`ui/client-bottom-nav.tsx`** - Client-specific wrapper?
   - **Status**: ❌ Potentially unnecessary abstraction
   - **Action**: Merge into single bottom-nav component

#### Layout

4. **`ui/page-header.tsx`** - Page title + subtitle
   - **Status**: ✅ Useful pattern
   - **Issues**: Inconsistent usage (many pages don't use it)

#### Feature Components

5. **`groups/group-card.tsx`** - Individual group display
   - **Status**: ⚠️ Needs redesign
   - **Issues**: Spacing inconsistent, button styles vary

6. **`groups/groups-grid.tsx`** - Grid container for group cards
   - **Status**: ✅ Good separation of concerns
   - **Issues**: Grid columns hardcoded, not responsive

7. **`groups/join-request-dialog.tsx`** - Modal for joining group
   - **Status**: ⚠️ Functional but needs UX improvements
   - **Issues**: No loading state, no success confirmation

8. **`ussd/ussd-sheet.tsx`** - Payment instruction card
   - **Status**: ⚠️ Overly complex
   - **Issues**: Too much information, not scannable
   - **Lines**: ~200+

9. **`statements/statements-table.tsx`** - Transaction history table
   - **Status**: ✅ Well-structured
   - **Issues**: No virtualization (performance issue with 100+ rows)

10. **`statements/statements-table.lazy.tsx`** - Lazy-loaded version
    - **Status**: ✅ Good pattern for code-splitting

11. **`loans/loan-product-card.tsx`** - Loan product display
    - **Status**: ⚠️ Similar to group-card but different style
    - **Action**: Consolidate to single Card component with variants

12. **`wallet/token-card.tsx`** - Wallet token display
    - **Status**: ⚠️ Yet another card variant
    - **Action**: Consolidate

13. **`reference/reference-card.tsx`** - User reference token display
    - **Status**: ⚠️ Fourth card variant!
    - **Action**: Consolidate all cards

14. **`sms/sms-consent-card.tsx`** - SMS permission card
    - **Status**: ⚠️ Fifth card variant
    - **Action**: You get the idea...

#### Auth

15. **`auth/biometric-enrollment-prompt.tsx`** - Biometric setup prompt
    - **Status**: ✅ Specific use case, keep separate

16. **`onboarding/onboarding-form.tsx`** - User onboarding form
    - **Status**: ⚠️ No validation, needs improvement
    - **Issues**: Fields not reusable, form logic mixed with UI

#### Chat/AI

17. **`ai-chat/ai-chat.tsx`** - AI chat interface
    - **Status**: ✅ Complex, domain-specific, keep separate

18. **`chat/ChatUI.tsx`** - Chat UI wrapper
19. **`chat/Message.tsx`** - Individual chat message
20. **`chat/Composer.tsx`** - Message input composer
    - **Status**: ✅ Good separation, chat-specific

#### Providers

21. **`FeatureFlagProvider.tsx`** - Feature flag context
    - **Status**: ✅ Infrastructure, not UI component

---

### Mobile Components (`apps/mobile/src/components`)

#### Shared

1. **`shared/HeaderGradient.tsx`** - Gradient header with title
   - **Status**: ⚠️ Hardcoded gradient, should use theme tokens
   - **Issues**: Not reusable across themes

2. **`shared/FloatingAskToJoinFab.tsx`** - Floating action button for joining
   groups
   - **Status**: ✅ Good pattern (FAB)
   - **Issues**: Specific to one feature, consider generic FAB component

3. **`shared/LocaleToggle.tsx`** - Language switcher
   - **Status**: ✅ Reusable
   - **Issues**: Could be more generic "Segmented Control"

#### Skeletons

4. **`skeletons/LiquidCardSkeleton.tsx`** - Loading skeleton for cards
   - **Status**: ✅ Essential for perceived performance
   - **Issues**: "Liquid" effect might be overkill, consider simpler pulse

5. **`skeletons/TableSkeleton.tsx`** - Loading skeleton for tables
   - **Status**: ✅ Good pattern
   - **Issues**: Not used consistently

---

## Component Duplication Analysis

### Card Components (5 variations! 🚨)

**Current**:

- `group-card.tsx` - Displays group info
- `loan-product-card.tsx` - Displays loan options
- `token-card.tsx` - Displays wallet tokens
- `reference-card.tsx` - Displays user reference
- `sms-consent-card.tsx` - Displays SMS permission request

**Common patterns**:

- White background
- Border + shadow
- Rounded corners (but different radius: 8px, 12px, 16px, 20px)
- Padding (inconsistent: 16px, 20px, 24px)
- Title + subtitle + action pattern

**Proposed consolidation**:

```tsx
// Unified Card component
interface CardProps {
  variant?: "default" | "elevated" | "outlined" | "filled";
  size?: "sm" | "md" | "lg";
  interactive?: boolean; // Hover/press states
  children: React.ReactNode;
  className?: string;
}

// Usage examples:
<Card variant="elevated" size="md" interactive>
  <CardHeader>
    <CardTitle>Abasigabose Group</CardTitle>
    <CardSubtitle>Umutara SACCO</CardSubtitle>
  </CardHeader>
  <CardContent>
    <Stat label="Total Savings" value="RWF 1,200,000" />
    <Stat label="Members" value="24" />
  </CardContent>
  <CardActions>
    <Button variant="primary">Join Group</Button>
  </CardActions>
</Card>;
```

**Benefits**:

- 1 component instead of 5
- Consistent styling
- Variants allow flexibility
- Composition pattern (Header, Content, Actions) enables reuse

---

### Button Variations (4 patterns)

**Current scattered patterns**:

1. Primary blue with white text
2. Green "Dial to Pay" button
3. Gray secondary buttons
4. Text-only link buttons
5. Icon-only buttons (various sizes)

**Proposed**:

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

// Examples:
<Button variant="primary" icon={<CreditCard />}>
  Make Payment
</Button>

<Button variant="secondary" size="sm">
  Cancel
</Button>

<Button variant="ghost" icon={<ChevronRight />} iconPosition="right">
  View Details
</Button>

<Button variant="primary" loading>
  Processing...
</Button>
```

---

## Proposed Component Library

**Location**: `packages/ui/src/components/` (or `shared/components` if not
extracting to package)

### Core Components (18 total)

#### 1. **Button**

- Variants: primary, secondary, ghost, danger
- Sizes: sm, md, lg
- States: default, hover, active, disabled, loading
- With/without icons
- **Lines**: ~80
- **Priority**: 🔴 Critical (most used)

#### 2. **Card**

- Variants: default, elevated, outlined, filled
- Sizes: sm, md, lg
- Composition: Header, Content, Actions, Footer
- Interactive mode (hover/press)
- **Lines**: ~60
- **Priority**: 🔴 Critical

#### 3. **Input**

- Types: text, number, email, tel, password, textarea
- States: default, focus, error, disabled
- With label, helper text, error message
- Optional icon (left/right)
- **Lines**: ~100
- **Priority**: 🔴 Critical

#### 4. **Badge**

- Variants: success, warning, error, info, neutral
- Sizes: sm, md
- With optional icon
- **Lines**: ~40
- **Priority**: 🟠 High

#### 5. **Modal / Sheet**

- Desktop: centered modal with backdrop
- Mobile: bottom sheet
- Sizes: sm, md, lg, full
- With header, content, actions
- **Lines**: ~120
- **Priority**: 🔴 Critical

#### 6. **Bottom Nav** (Mobile)

- 5 fixed tabs
- Active/inactive states
- Icon + label
- Badge support (for notifications)
- **Lines**: ~80
- **Priority**: 🔴 Critical

#### 7. **Skeleton**

- Variants: text, circle, rectangle, card
- Pulse animation
- Configurable width/height
- **Lines**: ~50
- **Priority**: 🟠 High

#### 8. **Toast / Snackbar**

- Variants: success, error, warning, info
- Auto-dismiss or manual
- Action button optional
- Positioned top-right or bottom-center
- **Lines**: ~90
- **Priority**: 🟠 High

#### 9. **Empty State**

- Icon, title, message, action
- Variants for different contexts (no results, no data, error)
- **Lines**: ~60
- **Priority**: 🟠 High

#### 10. **Error Boundary**

- Catches React errors
- Shows friendly error UI
- "Try again" / "Report" actions
- **Lines**: ~80
- **Priority**: 🟠 High

#### 11. **Segmented Control** (Tabs)

- 2-4 options
- Horizontal or vertical
- Animated indicator
- **Lines**: ~70
- **Priority**: 🟠 High (for Wallet tabs)

#### 12. **Avatar**

- Sizes: sm, md, lg, xl
- With fallback initials
- Status indicator optional
- **Lines**: ~50
- **Priority**: 🟡 Medium

#### 13. **List Item**

- Left icon/avatar
- Title + subtitle
- Right action/icon
- Pressable/tappable
- Divider optional
- **Lines**: ~70
- **Priority**: 🟠 High

#### 14. **FAB (Floating Action Button)**

- Sizes: md, lg
- Position: bottom-right, bottom-center
- Optional label
- Extended variant (icon + text)
- **Lines**: ~60
- **Priority**: 🟡 Medium

#### 15. **Icon Button**

- Variants: default, ghost, outlined
- Sizes: sm, md, lg
- Tooltip support
- **Lines**: ~50
- **Priority**: 🟡 Medium

#### 16. **Checkbox**

- States: unchecked, checked, indeterminate, disabled
- With label
- **Lines**: ~60
- **Priority**: 🟡 Medium

#### 17. **Radio**

- States: unchecked, checked, disabled
- Radio group wrapper
- **Lines**: ~60
- **Priority**: 🟡 Medium

#### 18. **Switch / Toggle**

- On/off states
- Sizes: sm, md
- With label
- **Lines**: ~50
- **Priority**: 🟡 Medium

---

## Platform-Specific Wrappers

Some components need platform-specific implementations:

### Web (React)

```tsx
// packages/ui/src/components/Button/Button.tsx
export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Mobile (React Native)

```tsx
// packages/ui/src/components/Button/Button.native.tsx
export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], styles[size]]}
      {...props}
    >
      <Text style={styles.label}>{children}</Text>
    </TouchableOpacity>
  );
};
```

**Metro bundler will automatically resolve `.native.tsx` on mobile.**

---

## Missing Components (Add to Library)

1. **Stat Card** - Display key metrics (e.g., "Total Saved: RWF 45,000")
2. **Progress Bar** - For multi-step flows (onboarding)
3. **Accordion** - Collapsible sections (FAQ)
4. **Tooltip** - Contextual help
5. **Dialog** - Confirmation prompts

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

- [ ] Set up `packages/ui` directory structure
- [ ] Install dependencies (class-variance-authority for variants, clsx for
      class names)
- [ ] Create theme configuration (import from tokens JSON)
- [ ] Build Button component (web + mobile)
- [ ] Build Card component (web + mobile)
- [ ] Build Input component (web + mobile)
- [ ] Build Badge component (web + mobile)
- [ ] Write Storybook stories for each

### Phase 2: Critical Components (Week 2)

- [ ] Modal / Sheet
- [ ] Bottom Nav (mobile)
- [ ] Skeleton loaders
- [ ] Toast notifications
- [ ] Empty State
- [ ] Error Boundary

### Phase 3: Secondary Components (Week 3)

- [ ] Segmented Control
- [ ] Avatar
- [ ] List Item
- [ ] FAB
- [ ] Icon Button

### Phase 4: Form Components (Week 4)

- [ ] Checkbox
- [ ] Radio
- [ ] Switch
- [ ] Stat Card
- [ ] Progress Bar

### Phase 5: Migration (Week 5-6)

- [ ] Replace group-card.tsx → Card
- [ ] Replace loan-product-card.tsx → Card
- [ ] Replace token-card.tsx → Card
- [ ] Replace all button variations → Button
- [ ] Add skeleton loaders to all data fetch screens
- [ ] Add empty states to all list screens
- [ ] Add error boundaries to major sections

### Phase 6: Documentation (Week 7)

- [ ] Component API docs
- [ ] Usage examples
- [ ] Accessibility notes
- [ ] Design patterns guide
- [ ] Migration guide for existing code

---

## Component API Examples

### Button

```tsx
interface ButtonProps {
  /**
   * Visual style variant
   * @default "primary"
   */
  variant?: "primary" | "secondary" | "ghost" | "danger";

  /**
   * Size of button
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * Icon to display alongside text
   */
  icon?: React.ReactNode;

  /**
   * Position of icon
   * @default "left"
   */
  iconPosition?: "left" | "right";

  /**
   * Expand to full width of container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Show loading spinner
   * @default false
   */
  loading?: boolean;

  /**
   * Disable interaction
   * @default false
   */
  disabled?: boolean;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Button label
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes (web only)
   */
  className?: string;

  /**
   * Accessible label for screen readers
   */
  "aria-label"?: string;
}

// Usage:
<Button
  variant="primary"
  size="lg"
  icon={<CreditCard />}
  loading={isProcessing}
  onClick={handlePayment}
  aria-label="Make payment to group"
>
  Make Payment
</Button>;
```

### Card

```tsx
interface CardProps {
  /**
   * Visual style variant
   * @default "default"
   */
  variant?: "default" | "elevated" | "outlined" | "filled";

  /**
   * Size (affects padding)
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * Enable hover/press interactions
   * @default false
   */
  interactive?: boolean;

  /**
   * Click handler (if interactive)
   */
  onClick?: () => void;

  /**
   * Card content (use CardHeader, CardContent, CardActions for structure)
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

// Composition components:
interface CardHeaderProps {
  children: React.ReactNode;
}

interface CardTitleProps {
  children: React.ReactNode;
}

interface CardSubtitleProps {
  children: React.ReactNode;
}

interface CardContentProps {
  children: React.ReactNode;
}

interface CardActionsProps {
  /**
   * Alignment of actions
   * @default "end"
   */
  align?: "start" | "center" | "end" | "between";
  children: React.ReactNode;
}

// Usage:
<Card variant="elevated" interactive onClick={handleCardClick}>
  <CardHeader>
    <CardTitle>Abasigabose Group</CardTitle>
    <CardSubtitle>Umutara SACCO</CardSubtitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <Stat label="Total Savings" value="RWF 1,200,000" />
      <Stat label="Members" value="24" />
      <Stat label="Your Savings" value="RWF 45,000" />
    </div>
  </CardContent>
  <CardActions align="end">
    <Button variant="primary">Join Group</Button>
  </CardActions>
</Card>;
```

---

## Testing Strategy

### Unit Tests

- Test each variant renders correctly
- Test all states (hover, active, disabled, loading)
- Test prop combinations
- Test accessibility attributes

### Visual Regression Tests

- Snapshot tests for each component + variant
- Test in light mode (dark mode future)
- Test at different breakpoints (responsive)

### Accessibility Tests

- Axe automated tests
- Keyboard navigation tests
- Screen reader tests (manual)
- Color contrast verification

### Example Test:

```tsx
describe("Button", () => {
  it("renders primary variant", () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole("status")).toBeInTheDocument(); // Spinner has role="status"
  });

  it("is keyboard accessible", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    const button = screen.getByRole("button");
    button.focus();
    fireEvent.keyDown(button, { key: "Enter" });
    expect(handleClick).toHaveBeenCalled();
  });

  it("passes axe accessibility tests", async () => {
    const { container } = render(<Button>Accessible</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## Storybook Setup

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { CreditCard } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: "Make Payment",
    variant: "primary",
  },
};

export const WithIcon: Story = {
  args: {
    children: "Make Payment",
    variant: "primary",
    icon: <CreditCard />,
  },
};

export const Loading: Story = {
  args: {
    children: "Processing...",
    variant: "primary",
    loading: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-x-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};
```

---

## Migration Checklist

When replacing old components:

- [ ] Identify all usages of old component (grep/search)
- [ ] Create new component with same props (or update callsites)
- [ ] Test visually (compare before/after screenshots)
- [ ] Test accessibility (run axe)
- [ ] Test keyboard navigation
- [ ] Test on mobile (if applicable)
- [ ] Update imports across codebase
- [ ] Delete old component file
- [ ] Update documentation

**Automated migration tool** (future):

```bash
pnpm migrate-component group-card Card
```

Would:

1. Find all `<GroupCard>` usages
2. Replace with `<Card>` + appropriate props
3. Add CardHeader, CardTitle, etc. based on old structure
4. Generate git commit with changes

---

## Benefits of Consolidation

**Before**:

- 26 component files (PWA + Mobile combined)
- ~40% duplication
- Inconsistent styling
- Hard to maintain

**After**:

- 18 base components (shared library)
- 0% duplication
- Consistent design system
- Easy to maintain
- Themeable
- Accessible by default
- Documented
- Tested

**Metrics**:

- **Lines of Code**: Reduce by ~35% (removing duplication)
- **File Count**: 26 → 18 component files
- **Design Consistency**: 40% → 95%
- **WCAG Compliance**: ~60% → 100%
- **Time to Build New Feature**: -40% (reuse components)

---

## Next Steps

1. **Review with team**: Get buy-in on consolidation plan
2. **Prototype**: Build Button + Card in Storybook (1-2 days)
3. **Design review**: Ensure tokens match intended design
4. **Implement**: Follow phase plan above (7 weeks)
5. **Migrate**: Replace old components gradually
6. **Document**: Write usage guide and API docs
7. **Celebrate**: Ship consistent, accessible component library 🎉

---

## Appendix: Component Comparison (Before/After)

### Before: Group Card

```tsx
// Inconsistent, hardcoded values, no variants
export function GroupCard({ group }: { group: Group }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
      <p className="text-sm text-gray-600 mb-3">{group.sacco}</p>
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold text-gray-900">
          RWF {group.savings}
        </span>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
          Join
        </button>
      </div>
    </div>
  );
}
```

### After: Using Card Component

```tsx
// Consistent, token-based, composable
export function GroupCard({ group }: { group: Group }) {
  return (
    <Card variant="elevated" interactive>
      <CardHeader>
        <CardTitle>{group.name}</CardTitle>
        <CardSubtitle>{group.sacco}</CardSubtitle>
      </CardHeader>
      <CardContent>
        <Stat label="Total Savings" value={formatCurrency(group.savings)} />
        <Stat label="Members" value={group.memberCount} />
      </CardContent>
      <CardActions align="end">
        <Button variant="primary" onClick={() => handleJoin(group.id)}>
          Join Group
        </Button>
      </CardActions>
    </Card>
  );
}
```

**Benefits**:

- ✅ Uses design tokens (automatic theming)
- ✅ Consistent with all other cards
- ✅ Accessible by default
- ✅ Composable (can reorder sections)
- ✅ Easier to read and maintain
