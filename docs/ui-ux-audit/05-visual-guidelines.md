# Visual Design Guidelines

## Overview

This document provides implementation guidelines for the Ibimina design system
based on `04-style-tokens.json`. It covers practical usage, examples, and rules
to ensure consistency across both PWA and mobile platforms while maintaining
WCAG 2.2 AA accessibility.

**Design Philosophy**: **Minimal, Clear, Accessible**

- Inspired by Revolut's clean interface
- Rwanda-inspired color accents for cultural connection
- WCAG 2.2 AA compliant throughout
- 8pt grid system for mathematical precision

---

## Color System

### Brand Colors

**Primary: Atlas Blue** (`#0066FF`)

- Use for: Primary CTAs, active states, links, focus indicators
- **Never use as background** for body text (fails contrast)
- Pair with white text only (14.0:1 contrast ✅)

```css
/* ✅ Good - Primary button */
.btn-primary {
  background: #0066ff;
  color: #ffffff;
}

/* ❌ Bad - Fails contrast */
.text-link {
  color: #0066ff;
  background: #e5e7eb; /* Only 3.1:1 */
}

/* ✅ Good - With sufficient contrast */
.text-link {
  color: #0052cc; /* Primary-dark: 5.8:1 on neutral-100 */
  background: #f3f4f6;
}
```

**Rwanda Colors** (Secondary use only)

- Use sparingly as accent colors, not primary interface elements
- Good for: Icons, badges, illustrations, feature highlights
- Example: Group card might have small Rwanda flag icon

### Text Colors

**Hierarchy**:

1. **Primary** (`#111827`) - Headings, important text (15.0:1 contrast)
2. **Secondary** (`#374151`) - Body text, labels (10.2:1 contrast)
3. **Tertiary** (`#6B7280`) - Supporting text, timestamps (4.6:1 contrast ✅
   passes AA)

```jsx
// ✅ Correct text hierarchy
<h2 className="text-neutral-900">Your Savings</h2>
<p className="text-neutral-700">You've contributed 3 times this month</p>
<span className="text-neutral-500">Last updated 5 minutes ago</span>
```

**⚠️ Warning**: `neutral-600` (#4B5563) is often used but **only achieves
4.7:1** on white. Use `neutral-700` for body text to guarantee AA compliance.

### Semantic Colors

**Status Colors** (Must pass 4.5:1 on white):

- Success: `#10B981` (3.9:1 ❌) → Use `#059669` (4.5:1 ✅) for text
- Warning: `#F59E0B` (2.4:1 ❌) → Use `#D97706` (4.8:1 ✅) for text
- Error: `#EF4444` (3.9:1 ❌) → Use `#DC2626` (5.9:1 ✅) for text

**Usage**:

```jsx
// ✅ Correct - Badge with background + border
<span className="bg-emerald-50 text-emerald-700 border border-emerald-200">
  Confirmed
</span>

// ✅ Correct - Icon with semantic color
<CheckCircle className="text-emerald-600" />
<span className="text-neutral-900">Payment confirmed</span>

// ❌ Bad - Semantic color as only indicator
<span className="text-amber-500">Pending</span> // Fails contrast + color-only communication
```

---

## Typography

### Font Families

**Primary**: System font stack (native performance, no web font load)

```css
font-family:
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  sans-serif;
```

**Monospace** (for codes, references):

```css
font-family:
  "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New",
  monospace;
```

### Type Scale

| Token  | Size | Line Height   | Usage                    | Example                   |
| ------ | ---- | ------------- | ------------------------ | ------------------------- |
| `xs`   | 12px | 1.5 (18px)    | Captions, labels, badges | "Updated 5 min ago"       |
| `sm`   | 14px | 1.5 (21px)    | Secondary body text      | Button labels, form hints |
| `base` | 16px | 1.5 (24px)    | **Primary body text**    | Paragraphs, list items    |
| `lg`   | 18px | 1.5 (27px)    | Emphasized body          | Lead paragraphs           |
| `xl`   | 20px | 1.25 (25px)   | Small headings           | Card titles               |
| `2xl`  | 24px | 1.25 (30px)   | Section headings         | Page sections             |
| `3xl`  | 30px | 1.25 (37.5px) | Page headings            | H1 on subpages            |
| `4xl`  | 36px | 1.25 (45px)   | Display text             | Landing page H1           |

**Rules**:

- Body text **minimum 16px** (WCAG guideline, improves readability on mobile)
- Headings use `1.25` line-height (tighter for better visual hierarchy)
- Body uses `1.5` line-height (comfortable reading)
- Never go below 12px (fails accessibility)

### Font Weights

- **Regular (400)**: Body text
- **Medium (500)**: Slightly emphasized (use sparingly)
- **Semibold (600)**: Buttons, headings, navigation labels
- **Bold (700)**: Strong emphasis (use sparingly)

**Avoid bold body text** - use color/size hierarchy instead.

```jsx
// ✅ Good hierarchy without bold
<h2 className="text-2xl font-semibold text-neutral-900">Your Groups</h2>
<p className="text-base text-neutral-700">You've joined 3 savings groups</p>

// ❌ Bad - overuse of bold
<p className="font-bold">Important:</p>
<p className="font-bold">Make sure you contribute by Saturday</p>
```

### Text Styles (Semantic)

**Pre-defined combinations**:

```css
/* Heading 1 - Page title */
.text-h1 {
  font-size: 30px;
  line-height: 1.25;
  font-weight: 600;
  color: #111827;
}

/* Heading 2 - Section title */
.text-h2 {
  font-size: 24px;
  line-height: 1.25;
  font-weight: 600;
  color: #111827;
}

/* Body - Default */
.text-body {
  font-size: 16px;
  line-height: 1.5;
  font-weight: 400;
  color: #374151;
}

/* Caption - Timestamps, metadata */
.text-caption {
  font-size: 12px;
  line-height: 1.5;
  font-weight: 400;
  color: #6b7280;
}

/* Button label */
.text-button {
  font-size: 16px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: 0.02em;
}
```

---

## Spacing (8pt Grid)

**Base unit: 4px**

All spacing uses multiples of 4px for visual rhythm and mathematical precision.

| Token | Value | Common Use                      |
| ----- | ----- | ------------------------------- |
| `0`   | 0px   | No spacing                      |
| `1`   | 4px   | Tight spacing (icon to text)    |
| `2`   | 8px   | Compact spacing (badge padding) |
| `3`   | 12px  | Small spacing                   |
| `4`   | 16px  | **Default component padding**   |
| `5`   | 20px  | Medium spacing                  |
| `6`   | 24px  | **Default section spacing**     |
| `7`   | 28px  | Large spacing                   |
| `8`   | 32px  | **Major section spacing**       |
| `10`  | 40px  | Extra large                     |
| `12`  | 48px  | Huge spacing                    |
| `16`  | 64px  | Page-level spacing              |

**Usage Examples**:

```jsx
// Card internal spacing
<div className="p-6"> {/* 24px all sides */}
  <h3 className="mb-2">Title</h3> {/* 8px bottom margin */}
  <p className="mb-4">Description</p> {/* 16px bottom margin */}
  <button>Action</button>
</div>

// Section spacing
<section className="mb-8"> {/* 32px bottom */}
  <h2>Groups</h2>
  {/* content */}
</section>

// Page padding
<main className="px-4 py-6"> {/* 16px horizontal, 24px vertical */}
  {/* content */}
</main>
```

**Rules**:

- Stick to the scale - avoid arbitrary values like `15px` or `13px`
- Smaller components use smaller spacing (buttons: `px-6 py-3`)
- Larger components use larger spacing (cards: `p-6`, modals: `p-8`)
- Consistent section spacing: `space-y-6` for lists, `space-y-8` for page
  sections

---

## Border Radius

**Consistent rounding** creates cohesive feel:

| Token  | Value  | Usage                          |
| ------ | ------ | ------------------------------ |
| `sm`   | 4px    | Small elements (badges, chips) |
| `base` | 8px    | **Buttons, inputs (default)**  |
| `md`   | 12px   | **Cards (default)**            |
| `lg`   | 16px   | Large cards, sheets            |
| `xl`   | 20px   | Prominent cards                |
| `2xl`  | 24px   | Feature cards, modals          |
| `full` | 9999px | Pills, circular avatars        |

**Examples**:

```jsx
// Button
<button className="rounded-lg"> {/* 8px */}

// Card
<div className="rounded-2xl"> {/* 12px */}

// Modal
<div className="rounded-3xl"> {/* 24px */}

// Badge
<span className="rounded-full"> {/* Pill shape */}

// Avatar
<img className="rounded-full"> {/* Circle */}
```

**Rule**: Larger elements get larger radius, but stay within scale.

---

## Elevation (Shadows)

**3-tier system** (avoid shadow proliferation):

### Tier 1: Base Elevation

```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
```

**Use for**: Cards, dropdowns, menus

### Tier 2: Elevated

```css
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
```

**Use for**: Modals, bottom sheets, hover states

### Tier 3: Floating

```css
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
```

**Use for**: FABs, prominent dialogs

**Focus Ring** (Accessibility):

```css
box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.3);
```

**Use for**: Keyboard focus indicators (never hide)

**Examples**:

```jsx
// Card (base elevation)
<div className="shadow-base">

// Card on hover (elevated)
<div className="shadow-base hover:shadow-md">

// Modal (elevated)
<div className="shadow-md">

// FAB (floating)
<button className="shadow-lg">

// Focus state (all interactive elements)
<button className="focus:shadow-focus">
```

**Rules**:

- Don't stack shadows (one element = one shadow tier)
- Hover states can increase shadow by one tier max
- Always include focus shadow for keyboard accessibility

---

## Motion & Transitions

**Duration**:

- **Fast (100ms)**: Instant feedback (button press, hover)
- **Base (150ms)**: **Default for most transitions**
- **Slow (200ms)**: Deliberate movements (expand/collapse)
- **Slower (300ms)**: Page transitions, sheet slides

**Easing**:

- **`ease-out`** (default): Decelerating - feels natural
- **`ease-in-out`**: Smooth both ends - for reversible actions
- **`bounce`**: Playful overshoot - success states only (use sparingly)

**Examples**:

```css
/* Button hover */
.btn {
  transition: all 150ms ease-out;
}

/* Sheet slide in */
.sheet {
  transition: transform 300ms ease-out;
}

/* Success checkmark bounce */
.checkmark {
  animation: bounce 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

**Reduced Motion**:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Always respect user preference** - critical for accessibility.

---

## Component Examples

### Primary Button

```jsx
<button
  className="
  bg-brand-primary 
  hover:bg-brand-primary-light 
  active:bg-brand-primary-dark 
  text-white 
  font-semibold 
  px-6 
  py-3 
  rounded-lg 
  shadow-sm 
  hover:shadow-base 
  transition-all 
  duration-150
  focus:outline-none
  focus:shadow-focus
  disabled:opacity-40
  disabled:cursor-not-allowed
  h-12
"
>
  Make Payment
</button>
```

**Anatomy**:

- Height: 48px (comfortable touch target)
- Padding: 24px horizontal, 12px vertical
- Radius: 8px (base)
- Shadow: sm → base on hover
- Focus: Blue ring (3px)
- Disabled: 40% opacity

---

### Card

```jsx
<div
  className="
  bg-white
  border
  border-neutral-200
  rounded-2xl
  p-6
  shadow-base
  hover:shadow-md
  hover:-translate-y-1
  transition-all
  duration-200
"
>
  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
    Abasigabose Group
  </h3>
  <p className="text-sm text-neutral-700 mb-4">Umutara SACCO</p>
  <div className="flex items-center justify-between">
    <span className="text-2xl font-bold text-neutral-900">RWF 45,000</span>
    <span className="text-xs text-neutral-500">24 members</span>
  </div>
</div>
```

**Anatomy**:

- Background: white with subtle border
- Padding: 24px (p-6)
- Radius: 12px (rounded-2xl)
- Shadow: base, increases to md on hover
- Hover: Lifts 4px (-translate-y-1)
- Text hierarchy: neutral-900 → neutral-700 → neutral-500

---

### Input Field

```jsx
<div className="space-y-2">
  <label
    htmlFor="amount"
    className="block text-sm font-medium text-neutral-700"
  >
    Amount (RWF)
  </label>
  <input
    id="amount"
    type="number"
    placeholder="Enter amount"
    className="
      w-full
      h-12
      px-4
      py-3
      border
      border-neutral-200
      rounded-lg
      text-base
      text-neutral-900
      placeholder:text-neutral-500
      focus:outline-none
      focus:border-brand-primary
      focus:shadow-focus
      disabled:bg-neutral-50
      disabled:text-neutral-500
      disabled:cursor-not-allowed
    "
  />
  <p className="text-xs text-neutral-600">Minimum contribution: RWF 1,000</p>
</div>
```

**Anatomy**:

- Height: 48px (h-12)
- Padding: 16px horizontal
- Border: neutral-200, becomes brand-primary on focus
- Focus ring: 3px blue shadow
- Label: Small, medium weight, secondary text
- Helper text: Extra small, tertiary text

---

### Badge / Status Indicator

```jsx
{
  /* Confirmed - Success */
}
<span
  className="
  inline-flex
  items-center
  px-2
  py-1
  rounded-full
  bg-emerald-50
  text-emerald-700
  border
  border-emerald-200
  text-xs
  font-semibold
"
>
  <CheckCircle className="w-3 h-3 mr-1" />
  Confirmed
</span>;

{
  /* Pending - Warning */
}
<span
  className="
  inline-flex
  items-center
  px-2
  py-1
  rounded-full
  bg-amber-50
  text-amber-700
  border
  border-amber-200
  text-xs
  font-semibold
"
>
  <Clock className="w-3 h-3 mr-1" />
  Confirming
</span>;
```

**Anatomy**:

- Pill shape (rounded-full)
- Light background + darker text + border (triple indication)
- Icon + text (never icon-only or color-only)
- 8px horizontal padding, 4px vertical
- 12px font size, semibold

**Accessibility**: ✅ Passes contrast, ✅ not color-only, ✅ has text label

---

### Bottom Navigation (Mobile)

```jsx
<nav
  className="
  fixed
  bottom-0
  left-0
  right-0
  z-50
  bg-white
  border-t
  border-neutral-200
  safe-area-inset-bottom
"
>
  <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
    {/* Active tab */}
    <button
      className="
      flex
      flex-col
      items-center
      justify-center
      min-w-[64px]
      min-h-[48px]
      px-3
      py-2
      rounded-xl
      bg-brand-primary-glow
      text-brand-primary
      font-bold
      focus:outline-none
      focus:shadow-focus
    "
    >
      <Home className="w-6 h-6 mb-1" />
      <span className="text-xs">Home</span>
    </button>

    {/* Inactive tab */}
    <button
      className="
      flex
      flex-col
      items-center
      justify-center
      min-w-[64px]
      min-h-[48px]
      px-3
      py-2
      rounded-xl
      text-neutral-700
      hover:text-brand-primary
      hover:bg-neutral-50
      focus:outline-none
      focus:shadow-focus
    "
    >
      <CreditCard className="w-6 h-6 mb-1" />
      <span className="text-xs">Pay</span>
    </button>
  </div>
</nav>
```

**Anatomy**:

- Fixed to bottom (z-50)
- Height: 64px (h-16)
- Each tab: min 64×48px (exceeds 44px minimum)
- Active: light blue background, blue text, bold
- Inactive: gray text, neutral on hover
- Icon: 24px, 4px margin below
- Label: 12px

---

## Mobile-Specific Guidelines (React Native)

### Touch Targets

**Minimum**: 44×44pt (Apple HIG, WCAG 2.2) **Recommended**: 48×48pt for primary
actions

```jsx
// ✅ Good - Generous tap target
<TouchableOpacity
  style={{ minHeight: 48, minWidth: 48, padding: 12 }}
>
  <Text>Action</Text>
</TouchableOpacity>

// ❌ Bad - Too small
<TouchableOpacity style={{ height: 32, width: 32 }}>
  <Icon size={20} />
</TouchableOpacity>
```

### Safe Areas

Always respect notch/home indicator:

```jsx
import { SafeAreaView } from "react-native-safe-area-context";

<SafeAreaView style={{ flex: 1 }}>{/* Content */}</SafeAreaView>;
```

### Text Scaling

Allow users to scale text (accessibility):

```jsx
// ✅ Good - Respects user preference
<Text allowFontScaling={true} style={{ fontSize: 16 }}>
  Body text
</Text>

// ❌ Bad - Fixed size
<Text allowFontScaling={false}>
  Text
</Text>
```

### Platform Differences

```jsx
import { Platform } from "react-native";

const styles = StyleSheet.create({
  button: {
    // iOS uses lighter shadows, Android uses elevation
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

---

## Dark Mode (Future)

**Not currently implemented**, but tokens support it:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --surface-base: #0b1020;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --border-default: #374151;
  }
}
```

**When implementing**:

1. Test all components in dark mode
2. Ensure 4.5:1 contrast on dark backgrounds
3. Invert shadow logic (use lighter shadows, or borders)
4. Provide toggle in settings

---

## Accessibility Checklist

Every component must:

- [ ] Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- [ ] Have sufficient color contrast (4.5:1 minimum)
- [ ] Provide visible focus indicators
- [ ] Support keyboard navigation
- [ ] Include proper ARIA labels where needed
- [ ] Never rely on color alone to convey information
- [ ] Have touch targets ≥44×44pt
- [ ] Allow font scaling (mobile)
- [ ] Respect `prefers-reduced-motion`
- [ ] Work with screen readers (test with VoiceOver/TalkBack)

---

## Implementation Notes

### PWA (Tailwind CSS)

```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0066FF",
          "primary-light": "#3385FF",
          "primary-dark": "#0052CC",
          "primary-glow": "rgba(0, 102, 255, 0.15)",
        },
        // ... import from tokens
      },
      spacing: {
        // Already defined 0-96, matches our scale
      },
      fontSize: {
        xs: ["12px", { lineHeight: "18px" }],
        sm: ["14px", { lineHeight: "21px" }],
        base: ["16px", { lineHeight: "24px" }],
        // ... rest of scale
      },
    },
  },
};
```

### Mobile (React Native)

```ts
// src/theme/index.ts
export const theme = {
  colors: {
    brand: {
      primary: "#0066FF",
      primaryLight: "#3385FF",
      primaryDark: "#0052CC",
    },
    // ... import from tokens
  },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    // ... rest of scale
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    // ...
  },
};

// Usage
import { theme } from "./theme";

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.brand.primary,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.spacing[2],
  },
});
```

---

## Resources

- **Tokens**: `04-style-tokens.json` (complete token definitions)
- **Component Audit**: `06-component-inventory.md` (component consolidation
  plan)
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/
- **Apple HIG**: https://developer.apple.com/design/human-interface-guidelines/
- **Material Design**: https://m3.material.io/ (for Android patterns)
