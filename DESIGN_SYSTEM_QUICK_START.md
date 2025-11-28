# Quick Start: Using the New Design System

## Import Patterns

### Layout Components

```tsx
import { Container, Stack, Grid } from "@ibimina/ui";
```

### Data Display

```tsx
import { DataCard, EmptyState } from "@ibimina/ui";
```

### Navigation

```tsx
import { SimplifiedSidebar, MobileNav, AdaptiveLayout } from "@ibimina/ui";
```

### Animations

```tsx
import { AnimatedPage } from "@ibimina/ui";
import { staggerContainer, staggerItem } from "@ibimina/ui";
```

### Hooks

```tsx
import { useResponsive, useFocusTrap, useLocalAI } from "@ibimina/ui";
```

## Common Patterns

### 1. Basic Page Layout

```tsx
export default function MyPage() {
  return (
    <AnimatedPage>
      <Container size="lg" padding="md">
        <Stack gap="lg">
          <h1>Page Title</h1>
          {/* Your content */}
        </Stack>
      </Container>
    </AnimatedPage>
  );
}
```

### 2. Stats Dashboard

```tsx
<Grid cols={4} gap="md" responsive={{ sm: 2, md: 2, lg: 4 }}>
  <DataCard>
    <DataCard.Header icon={DollarSign} title="Revenue" />
    <DataCard.Value value="$12,345" trend="up" />
    <DataCard.Description>↑ 12% from last month</DataCard.Description>
  </DataCard>
  {/* More cards... */}
</Grid>
```

### 3. Two-Column Layout

```tsx
<Grid cols={1} responsive={{ lg: 3 }} gap="lg">
  {/* Main content - spans 2 columns */}
  <div className="lg:col-span-2">{/* Main content */}</div>

  {/* Sidebar - spans 1 column */}
  <div>{/* Sidebar content */}</div>
</Grid>
```

### 4. Empty State

```tsx
import { FileText } from "lucide-react";

{
  items.length === 0 && (
    <EmptyState
      icon={FileText}
      title="No items found"
      description="Create your first item to get started."
      action={{
        label: "Create Item",
        onClick: () => createItem(),
      }}
    />
  );
}
```

### 5. Responsive Behavior

```tsx
import { useResponsive } from "@ibimina/ui";

function MyComponent() {
  const { isMobile, isDesktop } = useResponsive();

  return <div>{isMobile ? <MobileView /> : <DesktopView />}</div>;
}
```

### 6. Staggered Animations

```tsx
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@ibimina/ui";

<motion.div variants={staggerContainer} initial="hidden" animate="show">
  {items.map((item) => (
    <motion.div key={item.id} variants={staggerItem}>
      <Card>{item.name}</Card>
    </motion.div>
  ))}
</motion.div>;
```

### 7. AI-Enhanced Input

```tsx
import { SmartInput } from "@ibimina/ui";

const [query, setQuery] = useState("");

<SmartInput
  value={query}
  onChange={setQuery}
  placeholder="Search members..."
  aiEnabled
  suggestions={previousSearches}
  onAcceptSuggestion={(suggestion) => handleSearch(suggestion)}
/>;
```

## Migration Steps

### Step 1: Update Layout

**Before:**

```tsx
<div className="container mx-auto px-4">
  <div className="space-y-6">{/* content */}</div>
</div>
```

**After:**

```tsx
<Container size="lg" padding="md">
  <Stack gap="lg">{/* content */}</Stack>
</Container>
```

### Step 2: Replace Grids

**Before:**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* items */}
</div>
```

**After:**

```tsx
<Grid cols={4} gap="md" responsive={{ sm: 1, md: 2, lg: 4 }}>
  {/* items */}
</Grid>
```

### Step 3: Modernize Cards

**Before:**

```tsx
<div className="bg-card p-6 rounded-lg border">
  <p className="text-sm text-muted-foreground">Revenue</p>
  <p className="text-3xl font-bold">$12,345</p>
  <p className="text-sm text-emerald-500">↑ 12%</p>
</div>
```

**After:**

```tsx
<DataCard>
  <DataCard.Header title="Revenue" />
  <DataCard.Value value="$12,345" trend="up" />
  <DataCard.Description>↑ 12% from last month</DataCard.Description>
</DataCard>
```

### Step 4: Add Page Animations

**Before:**

```tsx
export default function Page() {
  return <div>{/* content */}</div>;
}
```

**After:**

```tsx
import { AnimatedPage } from "@ibimina/ui";

export default function Page() {
  return <AnimatedPage>{/* content */}</AnimatedPage>;
}
```

## Component Props Reference

### Stack

```tsx
<Stack
  direction="vertical" | "horizontal"  // default: "vertical"
  gap="none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"  // default: "md"
  align="start" | "center" | "end" | "stretch" | "baseline"  // default: "stretch"
  justify="start" | "center" | "end" | "between" | "around" | "evenly"  // default: "start"
  wrap={boolean}  // default: false
  fullWidth={boolean}  // default: false
  className={string}
/>
```

### Grid

```tsx
<Grid
  cols={1 | 2 | 3 | 4 | 6 | 12 | "auto"}  // default: 1
  gap="none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"  // default: "md"
  responsive={{ sm?: 1-12, md?: 1-12, lg?: 1-12, xl?: 1-12 }}
  fullWidth={boolean}  // default: false
  className={string}
/>
```

### Container

```tsx
<Container
  size="sm" | "md" | "lg" | "xl" | "full"  // default: "lg"
  padding="none" | "sm" | "md" | "lg"  // default: "md"
  centerContent={boolean}  // default: false
  className={string}
/>
```

### DataCard

```tsx
<DataCard loading={boolean} onClick={function} className={string}>
  <DataCard.Header
    icon={LucideIcon}
    title={string}
    action={ReactNode}
  />
  <DataCard.Value
    value={string | number}
    trend="up" | "down" | "neutral"
    suffix={string}
  />
  <DataCard.Description>{ReactNode}</DataCard.Description>
  <DataCard.Footer>{ReactNode}</DataCard.Footer>
</DataCard>
```

## Best Practices

1. **Always use layout primitives** instead of raw divs with Tailwind classes
2. **Wrap pages with AnimatedPage** for consistent transitions
3. **Use DataCard** for all metric/stat displays
4. **Leverage responsive props** instead of custom breakpoint classes
5. **Apply consistent spacing** using gap prop (xs, sm, md, lg, xl)
6. **Use EmptyState** for all empty data scenarios
7. **Implement loading states** with DataCard loading prop
8. **Follow accessibility guidelines** - use semantic HTML, ARIA labels

## Troubleshooting

### Components not found

```bash
# Ensure package is installed and linked
pnpm install
pnpm --filter @ibimina/ui build
```

### TypeScript errors

```bash
# Rebuild UI package
pnpm --filter @ibimina/ui build
```

### Styles not applying

- Ensure Tailwind config includes UI package paths
- Check that CSS is imported in app layout
- Verify component className prop usage

### Animations not working

- Check Framer Motion is installed: `pnpm add framer-motion`
- Verify component is client-side: add `"use client"` directive
- Check `prefers-reduced-motion` user setting

## Getting Help

- See examples in:
  `apps/pwa/staff-admin/app/(main)/dashboard/_modernized-example.tsx`
- Check component JSDoc comments for API documentation
- Review Storybook stories: `pnpm --filter @ibimina/ui storybook`
- Refer to: `DESIGN_SYSTEM_PHASE_1_COMPLETE.md`
