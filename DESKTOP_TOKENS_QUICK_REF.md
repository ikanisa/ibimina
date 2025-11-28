# Desktop Design Tokens - Quick Reference

## Tailwind Classes Now Available

### Typography

```tsx
// Display (Hero sections, dashboards)
<h1 className="text-display-xl">   {/* 48px / 1.1 / 700 / -0.02em */}
<h1 className="text-display-lg">   {/* 36px / 1.15 / 700 / -0.02em */}
<h1 className="text-display-md">   {/* 30px / 1.2 / 600 / -0.01em */}

// Headings
<h1 className="text-h1">           {/* 24px / 1.25 / 600 */}
<h2 className="text-h2">           {/* 20px / 1.3 / 600 */}
<h3 className="text-h3">           {/* 18px / 1.35 / 600 */}
<h4 className="text-h4">           {/* 16px / 1.4 / 600 */}

// Body
<p className="text-body-lg">       {/* 16px / 1.6 */}
<p className="text-body-md">       {/* 14px / 1.5 */}
<p className="text-body-sm">       {/* 12px / 1.45 */}
<p className="text-body-xs">       {/* 11px / 1.4 */}

// Monospace (Data, codes)
<code className="text-mono-md font-mono">  {/* 14px / 1.5 / JetBrains Mono */}
<code className="text-mono-sm font-mono">  {/* 12px / 1.45 / JetBrains Mono */}
```

### Colors

```tsx
// Primary (Kigali Blue) - 50 to 950
<div className="bg-primary-500 text-white">    {/* #3b82f6 */}
<div className="text-primary-600">             {/* #2563eb */}
<div className="border-primary-700">           {/* #1d4ed8 */}

// Accent (Rwandan Gold) - 50 to 900
<div className="bg-accent-500">                {/* #eab308 */}
<div className="text-accent-600">              {/* #ca8a04 */}

// Semantic (theme-aware via .light/.dark)
<div className="bg-success">                   {/* #10b981 light / #34d399 dark */}
<div className="text-warning">                 {/* #f59e0b light / #fbbf24 dark */}
<div className="border-error">                 {/* #ef4444 light / #f87171 dark */}
<div className="text-info">                    {/* #3b82f6 light / #60a5fa dark */}
```

### Spacing (8px grid)

```tsx
// Padding
<div className="p-px">     {/* 1px */}
<div className="p-0">      {/* 0 */}
<div className="p-0.5">    {/* 2px */}
<div className="p-1">      {/* 4px */}
<div className="p-1.5">    {/* 6px */}
<div className="p-2">      {/* 8px */}
<div className="p-2.5">    {/* 10px */}
<div className="p-3">      {/* 12px */}
<div className="p-4">      {/* 16px */}
<div className="p-5">      {/* 20px */}
<div className="p-6">      {/* 24px */}
<div className="p-8">      {/* 32px */}
<div className="p-10">     {/* 40px */}
<div className="p-12">     {/* 48px */}
<div className="p-16">     {/* 64px */}
<div className="p-20">     {/* 80px */}
<div className="p-24">     {/* 96px */}

// Works with: m-, p-, gap-, space-, w-, h-, top-, right-, bottom-, left-, etc.
```

### Shadows

```tsx
<div className="shadow-sm">        {/* Subtle elevation */}
<div className="shadow-md">        {/* Card elevation */}
<div className="shadow-lg">        {/* Modal/popover */}
<div className="shadow-xl">        {/* Large panels */}
<div className="shadow-inner">     {/* Inset effect */}
<div className="shadow-glow">      {/* Focus glow */}
```

### Border Radius

```tsx
<div className="rounded-none">     {/* 0 */}
<div className="rounded-sm">       {/* 4px */}
<div className="rounded-md">       {/* 6px */}
<div className="rounded-lg">       {/* 8px */}
<div className="rounded-xl">       {/* 12px */}
<div className="rounded-2xl">      {/* 16px */}
<div className="rounded-3xl">      {/* 24px */}
<div className="rounded-full">     {/* 9999px - pill */}
```

### Transitions

```tsx
<div className="duration-fast">       {/* 150ms */}
<div className="duration-normal">     {/* 200ms */}
<div className="duration-slow">       {/* 300ms */}
<div className="duration-spring">     {/* 500ms */}

<div className="ease-spring">         {/* cubic-bezier(0.34, 1.56, 0.64, 1) */}

// Example: smooth hover
<button className="transition-all duration-normal ease-spring hover:shadow-lg">
```

### Z-Index

```tsx
<div className="z-dropdown">        {/* 1000 */}
<div className="z-sticky">          {/* 1020 */}
<div className="z-fixed">           {/* 1030 */}
<div className="z-modalBackdrop">   {/* 1040 */}
<div className="z-modal">           {/* 1050 */}
<div className="z-popover">         {/* 1060 */}
<div className="z-tooltip">         {/* 1070 */}
<div className="z-commandPalette">  {/* 1080 */}
<div className="z-toast">           {/* 1090 */}
```

## Common Patterns

### Card Component
```tsx
<div className="p-6 bg-white dark:bg-surface-base-dark rounded-lg shadow-md border border-border-default hover:shadow-lg transition-normal">
  <h3 className="text-h3 mb-2">Title</h3>
  <p className="text-body-md text-text-secondary">Description</p>
</div>
```

### Button
```tsx
<button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md hover:shadow-lg transition-fast">
  Click Me
</button>
```

### Modal
```tsx
<div className="fixed inset-0 z-modalBackdrop bg-black/50">
  <div className="fixed inset-0 z-modal flex items-center justify-center p-6">
    <div className="bg-white dark:bg-surface-base-dark rounded-xl shadow-xl max-w-md w-full p-8">
      <h2 className="text-h2 mb-4">Modal Title</h2>
      <p className="text-body-md text-text-secondary">Content</p>
    </div>
  </div>
</div>
```

### Dashboard Stats
```tsx
<div className="grid grid-cols-3 gap-6">
  <div className="p-6 bg-white rounded-lg shadow-md">
    <div className="text-body-sm text-text-muted mb-2">Total Deposits</div>
    <div className="text-display-md text-primary-600">RWF 12.4M</div>
  </div>
  {/* More cards... */}
</div>
```

### Form Input
```tsx
<input 
  className="px-4 py-3 border border-border-default rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-fast"
  type="text"
/>
```

### Navigation
```tsx
<nav className="sticky top-0 z-sticky bg-white/80 backdrop-blur-lg border-b border-border-subtle">
  <div className="px-6 py-4">
    <div className="text-h4">SACCO+</div>
  </div>
</nav>
```

## React Hook Usage

```tsx
import { useDesktopTokens } from '@/design';

function MyComponent() {
  const tokens = useDesktopTokens('light'); // or 'dark'
  
  return (
    <div style={{
      padding: tokens.spacing[6],        // 24px
      borderRadius: tokens.radius.lg,    // 8px
      fontSize: tokens.typography.body.md.size,  // 14px
      lineHeight: String(tokens.typography.body.md.lineHeight), // 1.5
      backgroundColor: tokens.colors.surface.base,
      color: tokens.colors.text.primary,
      boxShadow: tokens.shadows.md,
      transition: tokens.transitions.normal,
    }}>
      Content
    </div>
  );
}
```

## Token Object Access

```tsx
import { desktopTokens } from '@/design';

// Access any token directly
const primaryBlue = desktopTokens.colors.primary[600];  // #2563eb
const spacing = desktopTokens.spacing[4];               // 1rem (16px)
const shadow = desktopTokens.shadows.md;                // shadow string
const radius = desktopTokens.radius.lg;                 // 0.5rem (8px)
const transition = desktopTokens.transitions.fast;      // 150ms ease-out
```

## Tips

1. **Consistent Spacing**: Use the 8px grid (p-2, p-4, p-6, p-8, etc.)
2. **Shadow Hierarchy**: sm < md < lg < xl for depth
3. **Typography Scale**: Use semantic names (h1, h2, body-md) not arbitrary sizes
4. **Theme Awareness**: Colors adapt to light/dark mode automatically
5. **Transitions**: Add `transition-normal` for smooth interactions
6. **Z-Index**: Use named values to avoid conflicts

## Documentation

Full documentation: `/src/design/README.md`
Implementation details: `/DESKTOP_TOKENS_IMPLEMENTATION.md`
