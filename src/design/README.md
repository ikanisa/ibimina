# Desktop Design Token System

Comprehensive design token system optimized for desktop applications, with full TypeScript support and theme-aware utilities.

## Overview

The desktop token system provides a complete set of design primitives:

- **Typography**: Display, heading, body, and monospace scales
- **Spacing**: 8px grid system
- **Colors**: Primary, accent, semantic, surface, text, and border colors
- **Shadows**: Desktop-optimized depth system
- **Radius**: Border radius scale
- **Transitions**: Timing and easing functions
- **Z-Index**: Layering scale

## Usage

### In React Components

```tsx
import { useDesktopTokens } from '@/design';

function MyComponent() {
  const tokens = useDesktopTokens('light'); // or 'dark'
  
  return (
    <div style={{
      padding: tokens.spacing[4],
      borderRadius: tokens.radius.lg,
      backgroundColor: tokens.colors.surface.base,
      color: tokens.colors.text.primary,
      boxShadow: tokens.shadows.md,
    }}>
      Content
    </div>
  );
}
```

### In Tailwind Config

```ts
import { withDesktopTokens } from '@/design/tailwind-desktop';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.tsx'],
  // ... other config
};

export default withDesktopTokens(config);
```

Or manually extend:

```ts
import { tailwindDesktopConfig } from '@/design/tailwind-desktop';

const config: Config = {
  theme: {
    extend: tailwindDesktopConfig.extend,
  },
};
```

### Using Tailwind Classes

```tsx
// Typography
<h1 className="text-display-xl">Hero Title</h1>
<h2 className="text-h1">Section Header</h2>
<p className="text-body-md">Body text</p>
<code className="text-mono-sm font-mono">Code</code>

// Colors
<div className="bg-primary-500 text-white">Primary</div>
<div className="bg-surface-base-light dark:bg-surface-base-dark">Themed</div>

// Spacing & Layout
<div className="p-4 space-y-6">
  <div className="mt-8">Content</div>
</div>

// Shadows & Radius
<div className="shadow-md rounded-lg">Card</div>

// Z-Index
<div className="z-modal">Modal content</div>
```

### Generating CSS Variables

```tsx
import { getDesktopTokensCss } from '@/design';

function GlobalStyles() {
  const lightVars = getDesktopTokensCss('light');
  const darkVars = getDesktopTokensCss('dark');
  
  return (
    <style jsx global>{`
      :root {
        ${Object.entries(lightVars).map(([k, v]) => `${k}: ${v};`).join('\n')}
      }
      
      [data-theme="dark"] {
        ${Object.entries(darkVars).map(([k, v]) => `${k}: ${v};`).join('\n')}
      }
    `}</style>
  );
}
```

## Token Reference

### Typography Scale

**Display** (Hero sections, dashboards)
- `display-xl`: 48px / 1.1 / 700 / -0.02em
- `display-lg`: 36px / 1.15 / 700 / -0.02em
- `display-md`: 30px / 1.2 / 600 / -0.01em

**Headings**
- `h1`: 24px / 1.25 / 600
- `h2`: 20px / 1.3 / 600
- `h3`: 18px / 1.35 / 600
- `h4`: 16px / 1.4 / 600

**Body**
- `body-lg`: 16px / 1.6
- `body-md`: 14px / 1.5
- `body-sm`: 12px / 1.45
- `body-xs`: 11px / 1.4

**Monospace**
- `mono-md`: 14px / 1.5 / JetBrains Mono
- `mono-sm`: 12px / 1.45 / JetBrains Mono

### Spacing Scale (8px grid)

```
px   → 1px
0    → 0
0.5  → 2px
1    → 4px
1.5  → 6px
2    → 8px
2.5  → 10px
3    → 12px
4    → 16px
5    → 20px
6    → 24px
8    → 32px
10   → 40px
12   → 48px
16   → 64px
20   → 80px
24   → 96px
```

### Color Palette

**Primary (Kigali Blue)**
- 50-950 scale from lightest to darkest

**Accent (Rwandan Gold)**
- 50-900 scale

**Semantic**
- success: light/dark variants
- warning: light/dark variants
- error: light/dark variants
- info: light/dark variants

**Surface**
- base, elevated, overlay, glass (all theme-aware)

**Text**
- primary, secondary, muted, inverse (all theme-aware)

**Border**
- default, hover, focus (all theme-aware)

### Shadows

```
sm    → Subtle elevation
md    → Card elevation
lg    → Modal/popover
xl    → Large panels
inner → Inset effect
glow  → Focus/attention
```

### Border Radius

```
none → 0
sm   → 4px
md   → 6px
lg   → 8px
xl   → 12px
2xl  → 16px
3xl  → 24px
full → 9999px (pill)
```

### Transitions

```
fast   → 150ms ease-out
normal → 200ms ease-out
slow   → 300ms ease-out
spring → 500ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Z-Index

```
dropdown       → 1000
sticky         → 1020
fixed          → 1030
modalBackdrop  → 1040
modal          → 1050
popover        → 1060
tooltip        → 1070
commandPalette → 1080
toast          → 1090
```

## Integration with Existing System

The desktop tokens complement the existing CSS var-based theme system:

- **Desktop tokens**: Static values, optimized for desktop UI
- **Original theme**: CSS var-based, runtime-switchable themes

Both systems can coexist. Use desktop tokens for new desktop-specific components, and the original theme system for responsive/mobile components.

## TypeScript Support

All tokens are fully typed:

```ts
import type { DesignTokens, ColorScale } from '@/design';

const tokens: DesignTokens = desktopTokens;
const primaryScale: ColorScale = tokens.colors.primary;
```

## Migration Guide

### From Inline Values

**Before:**
```tsx
<div style={{ padding: '16px', borderRadius: '8px' }}>
```

**After:**
```tsx
import { useDesktopTokens } from '@/design';

const tokens = useDesktopTokens();
<div style={{ padding: tokens.spacing[4], borderRadius: tokens.radius.lg }}>
```

### From Tailwind Arbitrary Values

**Before:**
```tsx
<div className="p-[16px] rounded-[8px]">
```

**After:**
```tsx
<div className="p-4 rounded-lg">
```

## Best Practices

1. **Use semantic names**: Prefer `spacing[4]` over `spacing['16px']`
2. **Theme awareness**: Use theme-aware colors from `useDesktopTokens(mode)`
3. **Consistent spacing**: Stick to the 8px grid for layout consistency
4. **Shadow hierarchy**: Use shadows to establish visual hierarchy
5. **Motion**: Apply transitions to interactive elements for polish
6. **Z-index**: Use named z-index values to avoid conflicts

## Examples

See the implementation in:
- `/apps/pwa/staff-admin/components/*` for React usage
- `/apps/pwa/staff-admin/tailwind.config.ts` for Tailwind integration
