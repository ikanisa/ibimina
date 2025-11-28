# Quick Start: Modern UI Implementation

## What Was Implemented

### ✅ Phase 1: Core Infrastructure (Complete)
1. **Layout Primitives**: Container, Stack, Grid (already existed, enhanced)
2. **Utilities**: cn(), animations library
3. **Hooks**: useResponsive, useFocusTrap

### ✅ Phase 2: Component Library (Complete)
1. **DataCard**: Compound component for stats/metrics
2. **EmptyState**: Consistent empty states
3. **Accessibility**: SkipLinks, AnimatedPage

### ✅ Phase 3: Navigation System (Complete)  
1. **SimplifiedSidebar**: Desktop navigation with nested menus
2. **MobileNav**: Bottom tab bar for mobile
3. **AdaptiveLayout**: Auto-switches layouts by screen size
4. **Header**: Top app bar with search/notifications

### ✅ Phase 4: Example Dashboard (Complete)
Modern dashboard showcasing all components

## How to Use Immediately

### 1. Apply to Root Layout

Edit `apps/pwa/staff-admin/app/layout.tsx`:

```tsx
import { AdaptiveLayout } from '@/components/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AdaptiveLayout>
          {children}
        </AdaptiveLayout>
      </body>
    </html>
  );
}
```

### 2. See Example Dashboard

Visit the example at:
```
apps/pwa/staff-admin/app/(main)/dashboard/modern-page.tsx
```

You can:
- Copy this file to `page.tsx` to replace existing dashboard
- Or use it as reference for other pages

### 3. Use Components in Any Page

```tsx
import { Container, Grid, Stack, DataCard } from '@ibimina/ui';
import { TrendingUp, Users } from 'lucide-react';

export default function MyPage() {
  return (
    <Container size="lg">
      <Stack gap="lg">
        <h1>My Dashboard</h1>
        
        <Grid cols={4} gap="md">
          <DataCard>
            <DataCard.Header icon={Users} title="Total Members" />
            <DataCard.Value value={1250} trend="up" />
            <DataCard.Description>125 new this month</DataCard.Description>
          </DataCard>
          
          <DataCard>
            <DataCard.Header icon={TrendingUp} title="Revenue" />
            <DataCard.Value value="5.2M" suffix="RWF" trend="up" />
            <DataCard.Description>↑ 12% from last month</DataCard.Description>
          </DataCard>
        </Grid>
      </Stack>
    </Container>
  );
}
```

## Component Reference

### Layout Components

#### Container
```tsx
<Container size="sm" | "md" | "lg" | "xl" | "full">
  {children}
</Container>
```

#### Stack
```tsx
<Stack 
  direction="vertical" | "horizontal"
  gap="none" | "xs" | "sm" | "md" | "lg" | "xl"
  align="start" | "center" | "end" | "stretch"
  justify="start" | "center" | "end" | "between" | "around"
>
  {children}
</Stack>
```

#### Grid
```tsx
<Grid 
  cols={1 | 2 | 3 | 4 | 5 | 6 | "auto"}
  gap="none" | "xs" | "sm" | "md" | "lg" | "xl"
>
  {children}
</Grid>
```

### DataCard

```tsx
<DataCard loading={isLoading} onClick={() => navigate('/details')}>
  <DataCard.Header 
    icon={IconComponent} 
    title="Card Title"
    action={<Badge>New</Badge>}
  />
  <DataCard.Value 
    value={1250} 
    trend="up" | "down" | "neutral"
    suffix="RWF"
  />
  <DataCard.Description>Additional info</DataCard.Description>
  <DataCard.Footer>
    <Button>Action</Button>
  </DataCard.Footer>
</DataCard>
```

### EmptyState

```tsx
<EmptyState
  icon={IconComponent}
  title="No data yet"
  description="Get started by creating your first item"
  action={{
    label: "Create Item",
    onClick: () => {}
  }}
/>
```

## Navigation Components

### SimplifiedSidebar
- Automatically used by AdaptiveLayout on desktop
- Collapsible with nested menus
- Active state highlighting
- Search integration

### MobileNav
- Automatically used by AdaptiveLayout on mobile
- Bottom tab bar with 5 items
- Animated active indicator

### Header
- Search, notifications, user menu
- Automatically used by AdaptiveLayout

## Hooks

### useResponsive

```tsx
import { useResponsive } from '@ibimina/ui';

function MyComponent() {
  const { isMobile, isTablet, isDesktop, breakpoint, dimensions } = useResponsive();
  
  if (isMobile) {
    return <MobileView />;
  }
  
  return <DesktopView />;
}
```

### useFocusTrap

```tsx
import { useFocusTrap } from '@ibimina/ui';

function Modal({ isOpen }: { isOpen: boolean }) {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
  
  return (
    <div ref={modalRef}>
      {/* Focus trapped to this container when isOpen=true */}
    </div>
  );
}
```

## Animation Library

```tsx
import { motion } from 'framer-motion';
import { 
  pageVariants, 
  staggerContainer, 
  staggerItem,
  scaleOnHover,
  slideIn,
  fade
} from '@ibimina/ui';

// Page transitions
<motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit">
  {children}
</motion.div>

// Staggered list
<motion.div variants={staggerContainer} initial="hidden" animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>

// Interactive card
<motion.div variants={scaleOnHover} initial="rest" whileHover="hover" whileTap="tap">
  <Card />
</motion.div>
```

## File Locations

### New Files Created
```
apps/pwa/staff-admin/components/navigation/
├── SimplifiedSidebar.tsx    # Desktop sidebar
├── MobileNav.tsx            # Mobile bottom nav
├── Header.tsx               # Top app bar
├── AdaptiveLayout.tsx       # Responsive layout switcher
└── index.ts                 # Exports

apps/pwa/staff-admin/app/(main)/dashboard/
└── modern-page.tsx          # Example dashboard

packages/ui/src/lib/
└── utils.ts                 # cn() utility
```

### Existing Files (Already in Repo)
```
packages/ui/src/components/
├── layout/
│   ├── Container.tsx        # Max-width wrapper
│   ├── Stack.tsx           # Flexbox layout
│   └── Grid.tsx            # CSS Grid layout
├── DataCard.tsx            # Stats card
├── EmptyState.tsx          # Empty state
├── SkipLinks.tsx           # Accessibility
├── AnimatedPage.tsx        # Page wrapper
└── SmartInput.tsx          # AI input

packages/ui/src/hooks/
├── useResponsive.ts        # Breakpoint detection
└── useFocusTrap.ts         # Focus management

packages/ui/src/lib/
└── animations.ts           # Framer Motion variants
```

## Migration Pattern

### Old Pattern (Current)
```tsx
export default function OldPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded p-4 bg-white">
          <h3 className="text-sm text-gray-500">Revenue</h3>
          <p className="text-2xl font-bold">$12,345</p>
          <p className="text-xs text-green-500">↑ 12%</p>
        </div>
      </div>
    </div>
  );
}
```

### New Pattern (Modern)
```tsx
import { Container, Grid, DataCard } from '@ibimina/ui';
import { TrendingUp } from 'lucide-react';

export default function NewPage() {
  return (
    <Container size="lg">
      <Grid cols={4} gap="md">
        <DataCard>
          <DataCard.Header icon={TrendingUp} title="Revenue" />
          <DataCard.Value value="$12,345" trend="up" />
          <DataCard.Description>↑ 12% from last month</DataCard.Description>
        </DataCard>
      </Grid>
    </Container>
  );
}
```

## Benefits

### Developer Experience
- ✅ Consistent component API
- ✅ TypeScript with full IntelliSense
- ✅ Composable components (DataCard.Header, DataCard.Value)
- ✅ Responsive by default
- ✅ Accessibility built-in

### User Experience
- ✅ Smooth animations (Framer Motion)
- ✅ Adaptive layouts (desktop/tablet/mobile)
- ✅ Fast interactions (200-300ms transitions)
- ✅ Loading states
- ✅ Empty states

### Performance
- ✅ Tree-shakeable imports
- ✅ Optimized animations (GPU-accelerated)
- ✅ Lazy loading ready
- ✅ Small bundle size

## Next Steps

### Immediate (Do Now)
1. ✅ Apply AdaptiveLayout to root layout
2. ✅ Replace existing dashboard with modern-page.tsx
3. ✅ Migrate 3-5 high-traffic pages using the new components

### Short Term (This Week)
1. Create CommandPalette (⌘K) for global search
2. Add Toast notification system
3. Create form components library
4. Build data table with sorting/filtering

### Medium Term (This Month)
1. Migrate all pages to new design system
2. Add chart/visualization components
3. Implement real-time features
4. Create comprehensive Storybook

## Support

- **Documentation**: See `MODERN_UI_IMPLEMENTATION.md` for full details
- **Examples**: Check `modern-page.tsx` for usage patterns
- **Component Source**: `packages/ui/src/components/`

## Testing

### Visual Testing
```bash
cd apps/pwa/staff-admin
pnpm run dev
# Visit http://localhost:3000/dashboard/modern-page
```

### Build Test
```bash
cd packages/ui
pnpm run build

cd ../../apps/pwa/staff-admin
pnpm run build
```

## Common Issues

### Import errors
If you see import errors, ensure `@ibimina/ui` is built:
```bash
cd packages/ui
pnpm run build
```

### Style not applying
Make sure Tailwind is configured to scan the UI package:
```js
// apps/pwa/staff-admin/tailwind.config.ts
content: [
  './app/**/*.{ts,tsx}',
  './components/**/*.{ts,tsx}',
  '../../packages/ui/src/**/*.{ts,tsx}', // Add this line
]
```

### TypeScript errors
Run typecheck to see all errors:
```bash
pnpm run typecheck
```

---

**Status**: Ready to use ✅  
**Compatibility**: Works with existing codebase ✅  
**Breaking Changes**: None (additive only) ✅
