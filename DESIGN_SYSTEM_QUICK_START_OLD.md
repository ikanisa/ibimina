# Modern Design System - Quick Start Guide

This guide shows you how to use the new layout primitives, DataCard, and animation utilities in your Ibimina SACCO apps.

## 🎨 Layout Primitives

### Stack - Flexible Vertical/Horizontal Layouts

Replace manual flexbox with semantic Stack component:

**Before:**
```tsx
<div className="flex flex-col gap-4 items-center">
  <Button>First</Button>
  <Button>Second</Button>
</div>
```

**After:**
```tsx
import { Stack } from "@ibimina/ui";

<Stack direction="vertical" gap="md" align="center">
  <Button>First</Button>
  <Button>Second</Button>
</Stack>
```

**Props:**
- `direction`: "vertical" | "horizontal" (default: "vertical")
- `gap`: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default: "md")
- `align`: "start" | "center" | "end" | "stretch" | "baseline" (default: "stretch")
- `justify`: "start" | "center" | "end" | "between" | "around" | "evenly" (default: "start")
- `wrap`: boolean (default: false)
- `fullWidth`: boolean (default: false)

### Grid - Responsive Grid Layouts

Replace manual grid classes with responsive Grid:

**Before:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
  <Card>Item 4</Card>
</div>
```

**After:**
```tsx
import { Grid } from "@ibimina/ui";

<Grid cols={4} gap="md" responsive={{ sm: 1, md: 2, lg: 4 }}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
  <Card>Item 4</Card>
</Grid>
```

**Props:**
- `cols`: 1 | 2 | 3 | 4 | 6 | 12 | "auto" (default: 1)
- `gap`: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default: "md")
- `responsive`: { sm?, md?, lg?, xl? } (optional)
- `fullWidth`: boolean (default: false)

### Container - Max-Width Content Wrapper

Replace manual max-width constraints:

**Before:**
```tsx
<div className="max-w-6xl mx-auto px-6 py-6">
  <h1>Page Title</h1>
  <p>Content...</p>
</div>
```

**After:**
```tsx
import { Container } from "@ibimina/ui";

<Container size="lg" padding="md">
  <h1>Page Title</h1>
  <p>Content...</p>
</Container>
```

**Props:**
- `size`: "sm" (672px) | "md" (896px) | "lg" (1152px) | "xl" (1280px) | "full" (default: "lg")
- `padding`: "none" | "sm" | "md" | "lg" (default: "md")
- `centerContent`: boolean (default: false)

### Spacer - Visual Spacing

Replace manual margin/padding with declarative spacing:

**Before:**
```tsx
<h1>Title</h1>
<div className="h-4" />
<p>Content</p>
```

**After:**
```tsx
import { Spacer } from "@ibimina/ui";

<h1>Title</h1>
<Spacer size="md" />
<p>Content</p>
```

**Props:**
- `size`: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default: "md")
- `direction`: "vertical" | "horizontal" (default: "vertical")

## 📊 DataCard - Metrics Display

Use DataCard for displaying stats, metrics, and key performance indicators:

**Example: Revenue Card**
```tsx
import { DataCard } from "@ibimina/ui";
import { TrendingUp } from "lucide-react";

<DataCard 
  loading={isLoading} 
  onClick={() => navigate('/revenue/details')}
>
  <DataCard.Header 
    icon={TrendingUp} 
    title="Total Revenue" 
    action={<Badge>This Month</Badge>}
  />
  <DataCard.Value 
    value="RWF 12,345,000" 
    trend="up" 
  />
  <DataCard.Description>
    ↑ 12% from last month
  </DataCard.Description>
  <DataCard.Footer>
    <Button variant="ghost" size="sm">View Report →</Button>
  </DataCard.Footer>
</DataCard>
```

**Sub-components:**

1. **DataCard.Header**
   - `icon`: Lucide icon component (optional)
   - `title`: string (required)
   - `action`: ReactNode (optional) - badges, buttons, etc.

2. **DataCard.Value**
   - `value`: string | number (required)
   - `trend`: "up" | "down" | "neutral" (optional)
   - `suffix`: string (optional) - e.g., "RWF", "%", "USD"

3. **DataCard.Description**
   - `children`: ReactNode - supporting text

4. **DataCard.Footer**
   - `children`: ReactNode - action buttons, links, etc.

**Loading State:**
When `loading={true}`, all sub-components automatically show skeletons.

**Click Interaction:**
When `onClick` is provided, the card becomes clickable (keyboard accessible with Enter/Space keys).

## 🎬 Animations

### AnimatedPage - Page Transitions

Wrap your page content for smooth transitions:

```tsx
import { AnimatedPage } from "@ibimina/ui";

export default function HomePage() {
  return (
    <AnimatedPage>
      <Container size="lg">
        <h1>Welcome</h1>
        <p>Content with fade-in animation</p>
      </Container>
    </AnimatedPage>
  );
}
```

### Custom Animations

Use animation variants for custom components:

```tsx
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@ibimina/ui";

<motion.ul variants={staggerContainer} initial="hidden" animate="show">
  {items.map((item) => (
    <motion.li key={item.id} variants={staggerItem}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

**Available Variants:**
- `pageVariants` - Page enter/exit (used by AnimatedPage)
- `staggerContainer` & `staggerItem` - List animations with stagger
- `scaleOnHover` - Interactive hover/tap effects
- `slideIn(direction)` - Slide from left/right/up/down
- `fade` - Simple opacity transition
- `skeletonPulse` - Loading state pulse
- `scaleIn` - Modal/dialog entrance
- `bounce` - Spring-based bounce

## 🔄 Migration Examples

### Example 1: Client Home Page Dashboard

**Before (CSS Modules):**
```tsx
// apps/pwa/client/app/(tabs)/home/page.tsx
<div className={styles.container}>
  <div className={styles.fullWidth}>
    <BalanceCard total={balance} />
  </div>
  <div className={styles.groupGrid}>
    {groups.map(group => <GroupCard key={group.id} {...group} />)}
  </div>
</div>
```

**After (Design System):**
```tsx
import { AnimatedPage, Container, Stack, Grid, DataCard } from "@ibimina/ui";
import { Wallet, Users } from "lucide-react";

export default function HomePage() {
  return (
    <AnimatedPage>
      <Container size="lg">
        <Stack gap="lg">
          {/* Balance Card */}
          <DataCard>
            <DataCard.Header icon={Wallet} title="Total Balance" />
            <DataCard.Value value={fmtCurrency(balance)} trend="up" suffix="RWF" />
            <DataCard.Description>Available balance</DataCard.Description>
          </DataCard>

          {/* Groups Grid */}
          <Grid cols={2} gap="md" responsive={{ sm: 1, lg: 2 }}>
            {groups.map(group => (
              <DataCard key={group.id} onClick={() => navigate(`/groups/${group.id}`)}>
                <DataCard.Header icon={Users} title={group.name} />
                <DataCard.Value value={fmtCurrency(group.total)} />
                <DataCard.Description>{group.memberCount} members</DataCard.Description>
              </DataCard>
            ))}
          </Grid>
        </Stack>
      </Container>
    </AnimatedPage>
  );
}
```

### Example 2: Staff Admin Dashboard

```tsx
import { AnimatedPage, Container, Stack, Grid, DataCard } from "@ibimina/ui";
import { Users, FileText, Clock, TrendingUp } from "lucide-react";

export default function StaffDashboard() {
  const { stats, isLoading } = useDashboardStats();

  return (
    <AnimatedPage>
      <Container size="xl">
        <Stack gap="lg">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Overview of SACCO operations</p>
          </div>

          {/* Stats Grid */}
          <Grid cols={4} gap="md" responsive={{ sm: 1, md: 2, lg: 4 }}>
            <DataCard loading={isLoading}>
              <DataCard.Header icon={Users} title="Total Members" />
              <DataCard.Value value={stats.totalMembers} trend="up" />
              <DataCard.Description>+12 this month</DataCard.Description>
            </DataCard>

            <DataCard loading={isLoading}>
              <DataCard.Header icon={FileText} title="Pending Approvals" />
              <DataCard.Value value={stats.pendingApprovals} />
              <DataCard.Description>{stats.urgent} urgent</DataCard.Description>
            </DataCard>

            <DataCard loading={isLoading}>
              <DataCard.Header icon={Clock} title="Overdue Tasks" />
              <DataCard.Value value={stats.overdueTasks} trend="down" />
              <DataCard.Description>-3 from yesterday</DataCard.Description>
            </DataCard>

            <DataCard loading={isLoading}>
              <DataCard.Header icon={TrendingUp} title="Completion Rate" />
              <DataCard.Value value="94%" trend="up" />
              <DataCard.Description>↑ 3% from last week</DataCard.Description>
            </DataCard>
          </Grid>
        </Stack>
      </Container>
    </AnimatedPage>
  );
}
```

## 🎯 Best Practices

### 1. Use Semantic Layouts
Prefer Stack/Grid over manual flex/grid classes for better maintainability:
```tsx
// ✅ Good
<Stack direction="horizontal" gap="md" justify="between">
  <h1>Title</h1>
  <Button>Action</Button>
</Stack>

// ❌ Avoid
<div className="flex flex-row gap-4 justify-between">
  <h1>Title</h1>
  <Button>Action</Button>
</div>
```

### 2. Responsive First
Always think mobile-first with responsive props:
```tsx
<Grid 
  cols={1} 
  gap="sm"
  responsive={{ 
    sm: 1,  // Mobile: 1 column
    md: 2,  // Tablet: 2 columns
    lg: 4   // Desktop: 4 columns
  }}
>
  {cards}
</Grid>
```

### 3. Loading States
Always handle loading states with DataCard:
```tsx
<DataCard loading={isLoading}>
  <DataCard.Header icon={Icon} title="Title" />
  <DataCard.Value value={data?.value ?? 0} />
</DataCard>
```

### 4. Animations Performance
Wrap page content with AnimatedPage, but don't overuse animations on every element:
```tsx
// ✅ Good: Animate page once
<AnimatedPage>
  <Container>
    <h1>Title</h1>
    <Stack gap="md">{content}</Stack>
  </Container>
</AnimatedPage>

// ❌ Avoid: Animating every child
<Container>
  <motion.h1>Title</motion.h1>
  <motion.p>Paragraph 1</motion.p>
  <motion.p>Paragraph 2</motion.p>
</Container>
```

### 5. Dark Mode Compatibility
All components support dark mode automatically. No manual theme classes needed:
```tsx
// Dark mode works automatically
<DataCard>
  <DataCard.Value value="$123" trend="up" />
</DataCard>
```

## 📦 Installation

These components are already available in `@ibimina/ui` package. To use them:

1. **Install dependencies** (if not already done):
   ```bash
   cd /Users/jeanbosco/workspace/ibimina
   pnpm install
   ```

2. **Import and use**:
   ```tsx
   import { Stack, Grid, Container, DataCard, AnimatedPage } from "@ibimina/ui";
   ```

3. **For animations**, ensure framer-motion is installed (already in package.json):
   ```json
   "dependencies": {
     "framer-motion": "^11.0.0"
   }
   ```

## 🐛 Troubleshooting

**Issue**: TypeScript errors with motion props
**Solution**: Use simplified AnimatedPage wrapper instead of spreading HTMLAttributes

**Issue**: Layout not responsive
**Solution**: Add `responsive` prop to Grid or use Container with appropriate size

**Issue**: Dark mode colors not working
**Solution**: Ensure your app has the theme provider from existing setup (nyungwe theme)

## 📚 Resources

- [Full Refactoring Plan](./UX_REFACTOR_PLAN.md)
- [Progress Report](./UX_REFACTOR_PROGRESS.md)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Last Updated**: November 28, 2024  
**Version**: 1.0.0
