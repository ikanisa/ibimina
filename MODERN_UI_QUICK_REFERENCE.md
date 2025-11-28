# Modern UI Quick Reference Card

## 🚀 3-Minute Quick Start

### 1. Modern Dashboard (Easiest)
Replace your dashboard in `apps/pwa/staff-admin/app/(main)/dashboard/page.tsx`:

```tsx
import { ModernDashboard } from '@/components/dashboard/ModernDashboard';
import { requireUserAndProfile } from '@/lib/auth';
import { getDashboardSummary } from '@/lib/dashboard';

export default async function DashboardPage() {
  const { profile } = await requireUserAndProfile();
  const summary = await getDashboardSummary({
    saccoId: profile.sacco_id,
    allowAll: profile.role === 'SYSTEM_ADMIN'
  });
  
  return (
    <ModernDashboard 
      summary={summary}
      userName={profile.full_name?.split(' ')[0] || 'there'}
    />
  );
}
```

**That's it!** You now have a modern, responsive dashboard.

### 2. Add Floating AI Assistant
In your root layout or any page:

```tsx
import { FloatingAssistant } from '@ibimina/ui';

export function Layout({ children }) {
  return (
    <>
      {children}
      <FloatingAssistant
        suggestions={[
          "Show me today's deposits",
          "Find member by phone",
          "Create a new group",
        ]}
      />
    </>
  );
}
```

### 3. Use Layout Primitives
For any page:

```tsx
import { Container, Stack, Grid, DataCard } from '@ibimina/ui';

export default function MyPage() {
  return (
    <Container size="lg">
      <Stack gap="lg">
        <h1>Page Title</h1>
        
        <Grid cols={4} gap="md">
          <DataCard>
            <DataCard.Header icon={Icon} title="Metric" />
            <DataCard.Value value="123" trend="up" />
            <DataCard.Description>Details</DataCard.Description>
          </DataCard>
        </Grid>
      </Stack>
    </Container>
  );
}
```

## 📦 Available Components

| Component | Import | Use Case |
|-----------|--------|----------|
| `Container` | `@ibimina/ui` | Max-width wrappers |
| `Stack` | `@ibimina/ui` | Vertical/horizontal layouts |
| `Grid` | `@ibimina/ui` | Responsive grids |
| `DataCard` | `@ibimina/ui` | Stats/metrics |
| `FloatingAssistant` | `@ibimina/ui` | AI chat widget |
| `SmartInput` | `@ibimina/ui` | AI autocomplete |
| `AdaptiveLayout` | `@ibimina/ui` | Responsive app layout |
| `Button` | `@ibimina/ui` | Buttons with variants |
| `EmptyState` | `@ibimina/ui` | Empty states |
| `LoadingState` | `@ibimina/ui` | Loading indicators |

## 🎨 Common Patterns

### Stats Grid
```tsx
<Grid cols={4} gap="md">
  <DataCard>
    <DataCard.Header icon={TrendingUp} title="Revenue" />
    <DataCard.Value value="$1,234" trend="up" />
  </DataCard>
</Grid>
```

### Responsive Layout
```tsx
<Container size="lg">
  <Stack gap="lg">
    {/* Content automatically stacks vertically with spacing */}
  </Stack>
</Container>
```

### Two-Column Layout
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">{/* Main content */}</div>
  <div>{/* Sidebar */}</div>
</div>
```

## 🔧 Props Reference

### Container
- `size`: `"sm" | "md" | "lg" | "xl"` (default: `"lg"`)

### Stack
- `direction`: `"vertical" | "horizontal"` (default: `"vertical"`)
- `gap`: `"none" | "xs" | "sm" | "md" | "lg" | "xl"` (default: `"md"`)
- `align`: `"start" | "center" | "end" | "stretch"`
- `justify`: `"start" | "center" | "end" | "between" | "around"`

### Grid
- `cols`: `1 | 2 | 3 | 4 | 6 | 12` or responsive object
- `gap`: `"none" | "xs" | "sm" | "md" | "lg" | "xl"` (default: `"md"`)

### DataCard
- `loading`: `boolean` - Show skeleton state
- `onClick`: `() => void` - Make clickable

## 📱 Responsive Breakpoints

| Name | Min Width | Use |
|------|-----------|-----|
| `xs` | 0px | Mobile |
| `sm` | 640px | Large Mobile |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large Desktop |
| `2xl` | 1536px | Extra Large |

## ⚡ Spacing Scale

| Name | Size | Pixels |
|------|------|--------|
| `none` | 0 | 0px |
| `xs` | 0.25rem | 4px |
| `sm` | 0.5rem | 8px |
| `md` | 1rem | 16px |
| `lg` | 1.5rem | 24px |
| `xl` | 2rem | 32px |

## 🎯 3 Integration Options

### Option A: Full Layout (Maximum Impact)
```tsx
// app/layout.tsx
import { ModernLayoutWrapper } from '@/components/layout/ModernLayoutWrapper';

export default function Layout({ children }) {
  return <ModernLayoutWrapper>{children}</ModernLayoutWrapper>;
}
```

### Option B: Dashboard Only (Safe Start)
```tsx
// app/(main)/dashboard/page.tsx
import { ModernDashboard } from '@/components/dashboard/ModernDashboard';
// ... use ModernDashboard
```

### Option C: Components Only (Most Gradual)
```tsx
// Any page
import { Container, Stack, Grid, DataCard } from '@ibimina/ui';
// ... use components individually
```

## 📚 Documentation

- **Full Guide**: `MODERN_UI_IMPLEMENTATION_GUIDE.md`
- **Strategy**: `MODERN_UI_REFACTOR_PLAN.md`
- **Component Details**: `MODERN_UI_PHASE1_COMPLETE.md`
- **This Summary**: `MODERN_UI_COMPLETE_SUMMARY.md`

## 🧪 Testing

```bash
# Start dev server
pnpm --filter staff-admin dev

# Build for production
pnpm --filter staff-admin build

# Type check
pnpm --filter staff-admin typecheck
```

## 💡 Pro Tips

1. **Start Small**: Begin with dashboard, then expand
2. **Test Mobile**: Use Chrome DevTools mobile view
3. **Check Accessibility**: Tab through your UI
4. **Use TypeScript**: Let it guide you
5. **Read Examples**: Check existing components

## 🆘 Troubleshooting

### Import Error
```bash
# Rebuild UI package
pnpm --filter @ibimina/ui build
```

### Style Issues
```bash
# Clear Next.js cache
rm -rf apps/pwa/staff-admin/.next
pnpm --filter staff-admin dev
```

### Type Errors
```bash
# Regenerate types
pnpm install
pnpm --filter @ibimina/ui build
```

## ✅ Checklist

- [ ] Read this quick reference
- [ ] Choose integration option (A, B, or C)
- [ ] Test in development
- [ ] Check mobile responsiveness
- [ ] Verify accessibility
- [ ] Deploy to staging
- [ ] Get user feedback
- [ ] Iterate and improve

## 🎁 What You Get

✅ Modern, responsive UI  
✅ AI-enhanced features  
✅ Mobile-first design  
✅ Accessibility built-in  
✅ Performance optimized  
✅ TypeScript safety  
✅ Production ready  

---

**Time to implement**: 15-30 minutes  
**Impact**: Massive UX improvement  
**Risk**: Minimal (backward compatible)  

**Let's build something amazing! 🚀**
