# Component Quick Reference Card

**Version**: 2.0 (Phases 1 & 2)  
**Last Updated**: November 28, 2024

## 📦 Import Statement

```tsx
import {
  // Layout
  Stack, Grid, Container, Spacer, AdaptiveLayout,
  // Navigation
  SimplifiedSidebar, MobileNav,
  // Data
  DataCard,
  // AI-Enhanced
  SmartInput, QuickActions,
  // Animation
  AnimatedPage,
  // Accessibility
  SkipLinks,
  // Hooks
  useResponsive, useFocusTrap,
  // Animation Variants
  pageVariants, staggerContainer, staggerItem, fade,
} from "@ibimina/ui";
```

## 🎨 Layout Components

### Stack
```tsx
<Stack direction="vertical" gap="md" align="center" justify="between">
  {children}
</Stack>
```
**Props**: direction, gap (none|xs|sm|md|lg|xl|2xl), align, justify, wrap, fullWidth

### Grid
```tsx
<Grid cols={4} gap="md" responsive={{ sm: 1, md: 2, lg: 4 }}>
  {children}
</Grid>
```
**Props**: cols (1|2|3|4|6|12|auto), gap, responsive, fullWidth

### Container
```tsx
<Container size="lg" padding="md">
  {children}
</Container>
```
**Props**: size (sm|md|lg|xl|full), padding (none|sm|md|lg), centerContent

### Spacer
```tsx
<Spacer size="md" direction="vertical" />
```
**Props**: size, direction

## 🧭 Navigation Components

### SimplifiedSidebar
```tsx
<SimplifiedSidebar
  items={navItems}
  logo={{ icon: Logo, text: "App", href: "/" }}
  onSearch={() => setSearchOpen(true)}
  onCreate={() => setCreateOpen(true)}
  defaultCollapsed={false}
/>
```

### MobileNav
```tsx
<MobileNav items={[
  { icon: Home, label: "Home", path: "/" },
  { icon: Users, label: "Team", path: "/team" },
]} />
```

### AdaptiveLayout
```tsx
<AdaptiveLayout
  navigation={navItems}
  mobileNavigation={mobileNav}
  header={<Header />}
  logo={logo}
  onSearch={handleSearch}
  onCreate={handleCreate}
>
  {children}
</AdaptiveLayout>
```

## 📊 Data Components

### DataCard
```tsx
<DataCard loading={isLoading} onClick={handleClick}>
  <DataCard.Header icon={Icon} title="Title" action={<Badge>New</Badge>} />
  <DataCard.Value value={123} trend="up" suffix="RWF" />
  <DataCard.Description>↑ 12% growth</DataCard.Description>
  <DataCard.Footer><Button>Action</Button></DataCard.Footer>
</DataCard>
```

## 🤖 AI-Enhanced Components

### SmartInput
```tsx
<SmartInput
  value={value}
  onChange={setValue}
  placeholder="Search..."
  aiEnabled={true}
  suggestions={["Option 1", "Option 2"]}
  onAcceptSuggestion={(s) => handleAccept(s)}
/>
```
**Note**: Press Tab to accept AI suggestions

### QuickActions
```tsx
<QuickActions
  actions={[
    { id: "new", icon: Plus, label: "New", action: () => create() },
    { id: "ai", icon: Sparkles, label: "Suggest", action: () => suggest(), ai: true },
  ]}
  maxVisible={5}
/>
```

## 🎬 Animation Components

### AnimatedPage
```tsx
<AnimatedPage>
  <Container>{children}</Container>
</AnimatedPage>
```

### Custom Animations
```tsx
<motion.div variants={staggerContainer} initial="hidden" animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>
      {item}
    </motion.div>
  ))}
</motion.div>
```

## ♿ Accessibility Components

### SkipLinks
```tsx
// In root layout
<html>
  <body>
    <SkipLinks />
    <nav id="main-navigation">...</nav>
    <main id="main-content">{children}</main>
  </body>
</html>
```

## 🪝 Hooks

### useResponsive
```tsx
const { isMobile, isTablet, isDesktop, breakpoint, width } = useResponsive();

if (isMobile) return <MobileNav />;
return <DesktopNav />;
```

### useFocusTrap
```tsx
const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

return (
  <div ref={modalRef} role="dialog">
    {/* Focus is trapped here */}
  </div>
);
```

## 🎨 Common Patterns

### Responsive Dashboard
```tsx
<AdaptiveLayout navigation={nav}>
  <AnimatedPage>
    <Container size="xl">
      <Stack gap="lg">
        <QuickActions actions={actions} />
        <Grid cols={4} responsive={{ sm: 1, md: 2, lg: 4 }}>
          <DataCard>...</DataCard>
          <DataCard>...</DataCard>
          <DataCard>...</DataCard>
          <DataCard>...</DataCard>
        </Grid>
      </Stack>
    </Container>
  </AnimatedPage>
</AdaptiveLayout>
```

### Search with AI
```tsx
<Stack gap="md">
  <SmartInput
    value={query}
    onChange={setQuery}
    aiEnabled
    suggestions={recent}
  />
  <QuickActions actions={smartActions} />
</Stack>
```

### Mobile-First Layout
```tsx
const { isMobile } = useResponsive();

return (
  <Stack gap="lg">
    <Grid cols={isMobile ? 1 : 3} gap="md">
      {cards}
    </Grid>
  </Stack>
);
```

## 📐 Sizing Reference

### Gap Sizes
- `none` = 0
- `xs` = 4px (0.25rem)
- `sm` = 8px (0.5rem)
- `md` = 16px (1rem) ← default
- `lg` = 24px (1.5rem)
- `xl` = 32px (2rem)
- `2xl` = 48px (3rem)

### Container Sizes
- `sm` = 672px (max-w-2xl)
- `md` = 896px (max-w-4xl)
- `lg` = 1152px (max-w-6xl) ← default
- `xl` = 1280px (max-w-7xl)
- `full` = 100% (max-w-full)

### Breakpoints
- `xs` = 0px (mobile small)
- `sm` = 640px (mobile large)
- `md` = 768px (tablet)
- `lg` = 1024px (desktop small)
- `xl` = 1280px (desktop large)
- `2xl` = 1536px (desktop xl)

## 🎯 Best Practices

1. **Always use semantic layouts**: Prefer Stack/Grid over manual flex/grid
2. **Mobile-first responsive**: Start with mobile, add responsive props
3. **Handle loading states**: Use DataCard loading prop
4. **Keyboard accessible**: All interactive elements work with Tab/Enter
5. **Dark mode ready**: All components support theme switching
6. **Animate wisely**: Use AnimatedPage for pages, not every element

## 🔗 Resources

- **Full Docs**: [DESIGN_SYSTEM_QUICK_START.md](./DESIGN_SYSTEM_QUICK_START.md)
- **Phase 1**: [PHASE_1_CHECKLIST.md](./PHASE_1_CHECKLIST.md)
- **Phase 2**: [PHASE_2_COMPLETE.md](./PHASE_2_COMPLETE.md)
- **Summary**: [UX_REFACTOR_PHASE_1_2_SUMMARY.md](./UX_REFACTOR_PHASE_1_2_SUMMARY.md)

---

**Print this card** for quick reference while coding!
