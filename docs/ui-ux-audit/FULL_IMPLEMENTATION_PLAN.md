# Full Atlas UI Implementation Plan - Complete Execution

**Date:** November 5, 2025  
**Status:** IN PROGRESS  
**Target:** Complete all phases (P0, P1, P2) for Client PWA, Mobile App, and
Website

## Executive Summary

This document tracks the complete implementation of the Atlas UI redesign across
all applications. Unlike previous partial implementations, this represents a
COMPLETE execution of all audit findings.

## Applications in Scope

1. **Website** (apps/website) - Marketing site
2. **Client PWA** (apps/client) - Member web application
3. **Mobile App** (apps/mobile) - React Native mobile application

## Implementation Status Overview

### Website ✅ COMPLETE (100%)

- Design tokens: ✅ Complete
- Components: ✅ Complete
- All pages: ✅ Complete
- Accessibility: ✅ WCAG AA compliant

### Client PWA 🔄 IN PROGRESS (50%)

- Design tokens: ✅ Complete
- Base components: ✅ Complete
- Loading states: ⚠️ Partial (3/23 pages)
- Color contrast: ⚠️ Partial fixes
- Keyboard navigation: ❌ Not started
- Alt text: ❌ Not started
- Error messages: ❌ Not started

### Mobile App ❌ NOT STARTED (0%)

- Design tokens: ❌ Not created
- Emoji icons: ❌ Need replacement
- Loading states: ❌ Not implemented
- Accessibility: ❌ Not implemented

## Phase-by-Phase Execution Plan

### PHASE 0: P0 FIXES (BLOCKERS) - 4 days

#### 0.1 Client PWA - Color Contrast (1 day) ❌

**Issue:** A11Y-1, A11Y-2, A11Y-3 **Priority:** BLOCKER

Files to update:

- Replace ALL `text-neutral-500` → `text-neutral-700`
- Replace ALL `text-neutral-600` → `text-neutral-700` on light backgrounds
- Update badge colors for WCAG compliance

Commands:

```bash
cd apps/client
# Find and replace all contrast issues
find . -name "*.tsx" -type f -exec sed -i '' 's/text-neutral-500/text-neutral-700/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/text-neutral-600/text-neutral-700/g' {} +
```

#### 0.2 Client PWA - Keyboard Navigation (1 day) ❌

**Issue:** A11Y-4, A11Y-5, A11Y-6  
**Priority:** BLOCKER

Files to update:

- `components/groups/group-card.tsx` - Convert div to button
- `components/loans/loan-product-card.tsx` - Add keyboard handlers
- `components/wallet/token-card.tsx` - Add keyboard handlers
- All interactive elements need tabIndex and onKeyDown

#### 0.3 Client PWA - Alt Text & ARIA (1 day) ❌

**Issue:** A11Y-21, A11Y-8, A11Y-23 **Priority:** BLOCKER

- Add alt text to all images
- Add aria-hidden="true" to decorative icons
- Fix VoiceOver/TalkBack order

#### 0.4 Client PWA - Error Messages (1 day) ❌

**Issue:** H9.1, H9.2, H9.3, H9.5 **Priority:** BLOCKER

- Replace technical jargon with plain language
- Add recovery actions to all error states
- Inline validation errors

### PHASE 1: P0 COMPLETION - 6 days

#### 1.1 Mobile App - Design Tokens (1 day) ❌

Create `apps/mobile/src/theme/tokens.ts`:

```typescript
export const tokens = {
  colors: {
    /* from design tokens */
  },
  spacing: {
    /* 8pt grid */
  },
  typography: {
    /* scales */
  },
  shadows: {
    /* tiers */
  },
};
```

#### 1.2 Mobile App - Replace Emoji Icons (2 days) ❌

**Issue:** H2.4, A11Y-9 **Priority:** BLOCKER

- Replace ALL emoji icons with Ionicons
- Add proper accessibility labels
- Test on iOS and Android

#### 1.3 Mobile App - Loading States (1 day) ❌

- Create skeleton components
- Add to all screens
- Test loading behavior

#### 1.4 Mobile App - Accessibility (2 days) ❌

**Issue:** A11Y-23, A11Y-24, A11Y-25

- Add accessibilityRole to all touchables
- Add accessibilityLabel to all interactive elements
- Add accessibilityHint where needed
- Fix VoiceOver/TalkBack order

### PHASE 2: LOADING STATES & SKELETONS - 3 days

#### 2.1 Client PWA - All Loading States (3 days) ❌

Create loading.tsx for all 23 routes:

- ✅ Home (done)
- ✅ Pay (done)
- ✅ Groups (done)
- ❌ Statements
- ❌ Profile
- ❌ Wallet
- ❌ Offers
- ❌ Chat
- ❌ Loans
- ❌ Support
- ❌ Terms/Privacy
- ❌ Group details
- ❌ Group members
- ❌ All other routes (10 remaining)

### PHASE 3: COMPONENT CONSOLIDATION - 4 days

#### 3.1 Standardize All Card Components (2 days) ❌

**Issue:** H4.2

Consolidate these into packages/ui Card component:

- `components/groups/group-card.tsx`
- `components/loans/loan-product-card.tsx`
- `components/wallet/token-card.tsx`
- `components/reference/reference-card.tsx`
- `components/sms/sms-consent-card.tsx`

#### 3.2 Standardize All Button Styles (1 day) ❌

**Issue:** H4.1

Ensure all buttons use packages/ui Button component

#### 3.3 Fix Spacing Inconsistencies (1 day) ❌

**Issue:** H4.3

Enforce 8pt grid everywhere

### PHASE 4: USER FLOWS & FEEDBACK - 5 days

#### 4.1 Add Loading Feedback (1 day) ❌

**Issue:** H1.1, H1.2, H1.3

- Toast notifications for actions
- Success/error states
- Progress indicators

#### 4.2 Improve Payment Flow (2 days) ❌

**Issue:** H1.6, H1.7, H2.4

- Add haptic feedback
- Improve reference copy UX
- Better USSD instructions

#### 4.3 Improve Group Flow (2 days) ❌

**Issue:** H3.1, H3.2

- Cancel join request button
- Better empty states
- Search/filter functionality

### PHASE 5: CONTENT & MICROCOPY - 3 days

#### 5.1 Replace All Jargon (2 days) ❌

**Issue:** H2.1, H2.2

Replace 18 instances of technical terms:

- "reference tokens" → "payment codes"
- "allocations" → "contributions"
- "merchant code" → "SACCO code"
- etc.

#### 5.2 Improve Error Messages (1 day) ❌

**Issue:** H9.1

Update all API error responses

### PHASE 6: POLISH & QA - 5 days

#### 6.1 Accessibility Audit (2 days) ❌

- Run axe DevTools
- Test with VoiceOver
- Test with TalkBack
- Fix all remaining issues

#### 6.2 Visual QA (1 day) ❌

- Test all pages at 200% zoom
- Test reduced motion
- Test dark mode (if applicable)

#### 6.3 Performance Testing (1 day) ❌

- Run Lighthouse on all pages
- Check bundle sizes
- Optimize if needed

#### 6.4 Final Testing (1 day) ❌

- Manual testing of all flows
- Cross-browser testing
- Mobile device testing

## Success Metrics Tracking

### Baseline (Before)

- WCAG Compliance: 60%
- Design Consistency: 40%
- Loading States: 0/23 pages (0%)
- Avg Taps to Task: 4.8
- Support Tickets: 35/week

### Current (In Progress)

- WCAG Compliance: 65%
- Design Consistency: 55%
- Loading States: 3/23 pages (13%)
- Avg Taps to Task: 4.8 (not improved yet)
- Support Tickets: 35/week (not improved yet)

### Target (After Complete Implementation)

- WCAG Compliance: 100%
- Design Consistency: 95%
- Loading States: 23/23 pages (100%)
- Avg Taps to Task: 2.9 (-40%)
- Support Tickets: 15/week (-57%)

## Timeline

- **Phase 0 (P0 Fixes):** 4 days
- **Phase 1 (P0 Mobile):** 6 days
- **Phase 2 (Loading):** 3 days
- **Phase 3 (Components):** 4 days
- **Phase 4 (Flows):** 5 days
- **Phase 5 (Content):** 3 days
- **Phase 6 (QA):** 5 days

**TOTAL:** 30 working days (6 weeks) with 1 developer  
**OR:** 15 working days (3 weeks) with 2 developers in parallel

## Next Session Tasks

1. ✅ Create this implementation plan
2. ⏳ Execute Phase 0.1 - Color contrast fixes
3. ⏳ Execute Phase 0.2 - Keyboard navigation
4. ⏳ Execute Phase 0.3 - Alt text & ARIA
5. ⏳ Execute Phase 0.4 - Error messages

## Notes

- This is a COMPLETE implementation, not partial
- Every finding from the audit will be addressed
- No shortcuts or "good enough" solutions
- Full WCAG AA compliance required
- Comprehensive testing at each phase
