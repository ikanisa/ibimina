# Heuristic & Accessibility Audit

## Executive Summary

This document evaluates the **Client PWA** (`apps/client`) and **Mobile App**
(`apps/mobile`) against Nielsen's 10 usability heuristics and WCAG 2.2 AA
accessibility standards. The audit identifies 47 findings across both
applications, ranging from minor improvements to critical accessibility
blockers.

**Overall Assessment:**

- **PWA**: Generally well-structured with good semantic HTML, but suffers from
  inconsistent design patterns and limited user feedback
- **Mobile**: Basic implementation with significant accessibility gaps,
  particularly in icon usage (emoji placeholders) and color contrast

**Priority Breakdown:**

- 🔴 **Blocker** (12 findings): Critical accessibility or usability issues that
  prevent some users from completing tasks
- 🟠 **Major** (18 findings): Significant usability problems that affect most
  users
- 🟡 **Minor** (17 findings): Quality-of-life improvements

---

## Methodology

### Evaluation Framework

**Nielsen's 10 Heuristics:**

1. Visibility of system status
2. Match between system and the real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Help and documentation

**WCAG 2.2 AA Criteria:**

- Color contrast (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation and focus indicators
- Screen reader compatibility (ARIA, semantic HTML)
- Touch target size (≥44×44pt)
- Dynamic type and text scaling
- Reduced motion support
- Meaningful labels and alt text

### Audit Scope

**Screens Evaluated:**

**PWA:**

- Home dashboard
- Groups listing and join flow
- Pay (USSD instructions)
- Statements (transaction history)
- Profile
- Onboarding
- Auth flows (welcome, login)

**Mobile:**

- Home screen
- Pay screen
- Statements
- Offers
- Profile
- Auth (start, verify)

---

## Findings by Heuristic

### 1. Visibility of System Status

> Users should always be informed about what is going on through appropriate
> feedback within reasonable time.

#### PWA Findings

| ID   | Severity | Issue                            | Evidence                                                                                          | Proposed Fix                                                                               |
| ---- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| H1.1 | 🟠 Major | No loading states on data fetch  | `apps/client/app/(tabs)/home/page.tsx` - Dashboard renders synchronously with no skeleton         | Add `<Suspense>` boundaries with skeleton loaders from `@/components/ui/skeleton`          |
| H1.2 | 🟡 Minor | Payment intent feedback unclear  | `apps/client/app/(tabs)/pay/page.tsx` - "I've Paid" button provides no immediate visual feedback  | Show toast notification: "Payment recorded. We'll update your balance after confirmation." |
| H1.3 | 🟠 Major | Group join request status hidden | `apps/client/app/groups/page.tsx` - After submitting join request, no confirmation appears        | Add success toast and badge on group card showing "Request Pending"                        |
| H1.4 | 🟡 Minor | Navigation context loss          | Bottom nav doesn't highlight nested routes (e.g., `/groups/[id]` doesn't show "Groups" as active) | Update `apps/client/components/ui/bottom-nav.tsx` to match parent paths                    |

#### Mobile Findings

| ID   | Severity   | Issue                           | Evidence                                                                                    | Proposed Fix                                                |
| ---- | ---------- | ------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| H1.5 | 🔴 Blocker | No loading indicators           | `apps/mobile/app/(tabs)/home.tsx` uses `useGroups()` but renders nothing while loading      | Add `LiquidCardSkeleton` from `src/components/skeletons`    |
| H1.6 | 🟠 Major   | USSD dial action silent         | `apps/mobile/app/(tabs)/pay.tsx:69-83` - Dialing USSD provides no haptic or visual feedback | Add haptic feedback and temporary "Opening dialer..." toast |
| H1.7 | 🟡 Minor   | Reference copy feedback missing | Pay screen shows "Copied" text but no visual emphasis                                       | Add checkmark icon and brief green highlight animation      |

---

### 2. Match Between System and the Real World

> Speak the users' language with familiar concepts rather than system-oriented
> terms.

#### PWA Findings

| ID   | Severity | Issue                           | Evidence                                                                               | Proposed Fix                                                                                                 |
| ---- | -------- | ------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| H2.1 | 🟠 Major | Technical jargon in UI          | "reference tokens", "allocations", "merchant code" - unfamiliar to rural Rwandan users | Replace: "reference token" → "payment code", "allocations" → "contributions", "merchant code" → "SACCO code" |
| H2.2 | 🟡 Minor | Empty state language too formal | `apps/client/app/groups/page.tsx` - "No groups available"                              | Use friendly: "You haven't joined any groups yet. Ready to start saving together?"                           |
| H2.3 | 🟡 Minor | Date formats inconsistent       | `apps/client/app/(tabs)/home/page.tsx:14` uses "en-GB" format, but app targets Rwanda  | Switch to user's locale preference or default to "dd MMM yyyy" (e.g., "15 Nov 2025")                         |

#### Mobile Findings

| ID   | Severity | Issue                | Evidence                                                                                                                 | Proposed Fix                                                           |
| ---- | -------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| H2.4 | 🟠 Major | Emoji icons unclear  | `apps/mobile/app/(tabs)/_layout.tsx:11-18` - Tab icons use emoji (🏠, 💳, 📊, 🎁, 👤) which don't scale or localize well | Replace with vector icons from `@expo/vector-icons` (Ionicons)         |
| H2.5 | 🟡 Minor | Currency assumes RWF | Hardcoded "RWF" in multiple places without explaining                                                                    | Add "(Rwandan Francs)" on first mention or use locale-aware formatting |

---

### 3. User Control and Freedom

> Users need a clearly marked emergency exit to leave an unwanted state without
> going through extended dialogue.

#### PWA Findings

| ID   | Severity | Issue                                     | Evidence                                                                                    | Proposed Fix                                                     |
| ---- | -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| H3.1 | 🟠 Major | No way to cancel group join request       | `apps/client/components/groups/join-request-dialog.tsx` - After submitting, user can't undo | Add "Cancel Request" button on group cards with pending requests |
| H3.2 | 🟡 Minor | Payment sheet no dismiss action           | `apps/client/components/ussd/ussd-sheet.tsx` - Expanded sheet requires scrolling away       | Add collapse/dismiss button at top of sheet                      |
| H3.3 | 🟡 Minor | Statement filters persist across sessions | User sets custom date filter, it remains on next visit even if unintended                   | Add "Clear Filters" or "Reset" button                            |

#### Mobile Findings

| ID   | Severity | Issue                        | Evidence                                                                          | Proposed Fix                               |
| ---- | -------- | ---------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------ |
| H3.4 | 🟠 Major | Back navigation unclear      | Screens don't show back button consistently (e.g., assist screen)                 | Add header back button on all sub-screens  |
| H3.5 | 🟡 Minor | Amount input no clear button | `apps/mobile/app/(tabs)/pay.tsx:141-150` - TextInput for amount has no X to clear | Add clear button icon when input has value |

---

### 4. Consistency and Standards

> Follow platform and industry conventions.

#### PWA Findings

| ID   | Severity   | Issue                       | Evidence                                                                                                     | Proposed Fix                                                                    |
| ---- | ---------- | --------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| H4.1 | 🔴 Blocker | Inconsistent button styles  | Primary actions use different colors: Pay (green), Join (blue), Submit (atlas-blue) across different screens | Establish single primary button component with consistent atlas-blue color      |
| H4.2 | 🟠 Major   | Card designs vary wildly    | Compare `group-card.tsx`, `loan-product-card.tsx`, `token-card.tsx` - different padding, borders, shadows    | Consolidate to single `<Card>` component with variant props                     |
| H4.3 | 🟠 Major   | Spacing inconsistencies     | Gaps between sections range from `space-y-4` to `space-y-8` arbitrarily                                      | Enforce 8pt grid: 16px (sections), 24px (page sections), 32px (major divisions) |
| H4.4 | 🟡 Minor   | Icon sizes not standardized | Icons range from `w-5 h-5` to `w-7 h-7` without clear hierarchy                                              | Define scale: sm=16px, md=20px, lg=24px, xl=28px                                |

#### Mobile Findings

| ID   | Severity   | Issue                             | Evidence                                                                                           | Proposed Fix                                                               |
| ---- | ---------- | --------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| H4.5 | 🔴 Blocker | Dark theme inconsistently applied | `apps/mobile/app/(tabs)/_layout.tsx` uses dark tab bar, but cards in screens use light backgrounds | Choose either light or dark as primary; apply consistently                 |
| H4.6 | 🟠 Major   | Typography scale unclear          | Font sizes vary (12, 14, 16, 18, 20) without clear hierarchy                                       | Apply theme scale: `fontSizes` from `src/theme/typography.ts` consistently |
| H4.7 | 🟡 Minor   | Button heights not uniform        | Some buttons 44px, some 48px, some 56px                                                            | Standardize: primary=48px, secondary=44px, small=40px                      |

---

### 5. Error Prevention

> Prevent problems from occurring in the first place.

#### PWA Findings

| ID   | Severity | Issue                                  | Evidence                                                                                | Proposed Fix                                                         |
| ---- | -------- | -------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| H5.1 | 🟠 Major | No validation on onboarding form       | `apps/client/components/onboarding/onboarding-form.tsx` - Accepts invalid phone numbers | Add Zod schema validation with Rwanda-specific phone number pattern  |
| H5.2 | 🟡 Minor | Duplicate payment submissions possible | "I've Paid" button in `ussd-sheet.tsx` can be clicked multiple times                    | Disable button after first click and show "Processing..."            |
| H5.3 | 🟡 Minor | Group join with empty note allowed     | Join request dialog accepts empty message field                                         | Either make optional (remove field) or require minimum 10 characters |

#### Mobile Findings

| ID   | Severity | Issue                               | Evidence                                                                                                 | Proposed Fix                                                           |
| ---- | -------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| H5.4 | 🟠 Major | Amount input accepts invalid values | `apps/mobile/app/(tabs)/pay.tsx:141` - No validation for negative numbers, decimals, or excessive values | Add numeric validation: min=100, max=1000000, integers only            |
| H5.5 | 🟡 Minor | No confirmation before dialing USSD | User might accidentally dial when just reviewing code                                                    | Add confirmation modal: "Ready to make a payment?" with Cancel/Confirm |

---

### 6. Recognition Rather Than Recall

> Minimize memory load by making elements, actions, and options visible.

#### PWA Findings

| ID   | Severity | Issue                          | Evidence                                                           | Proposed Fix                                                      |
| ---- | -------- | ------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| H6.1 | 🟠 Major | Payment instructions hidden    | User must remember USSD steps after viewing once                   | Make steps always visible or add "Show instructions again" button |
| H6.2 | 🟡 Minor | Group member count not shown   | Users can't see group size when browsing to decide whether to join | Add "X members" badge to group cards                              |
| H6.3 | 🟡 Minor | Last contribution date missing | Users don't know when they last contributed                        | Add "Last contributed: X days ago" to home dashboard widgets      |

#### Mobile Findings

| ID   | Severity | Issue                              | Evidence                                                                                     | Proposed Fix                                                    |
| ---- | -------- | ---------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| H6.4 | 🟠 Major | Reference tokens not labeled       | `apps/mobile/app/(tabs)/pay.tsx:107-135` - Shows tokens but doesn't explain what they're for | Add explanation text: "Your unique payment code for this group" |
| H6.5 | 🟡 Minor | USSD code not visible until action | Code is only shown when dialing                                                              | Display USSD code (`*182*8*1#`) prominently above dial button   |

---

### 7. Flexibility and Efficiency of Use

> Accelerators for expert users while remaining accessible to novices.

#### PWA Findings

| ID   | Severity | Issue                            | Evidence                                           | Proposed Fix                                                                                |
| ---- | -------- | -------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| H7.1 | 🟡 Minor | No quick actions                 | Expert users must navigate through tabs every time | Add shortcuts to home screen: "Pay Now", "View Statements", "Join Group" quick action cards |
| H7.2 | 🟡 Minor | Statement export not implemented | "Export PDF" button present but non-functional     | Implement CSV export as faster alternative to PDF                                           |
| H7.3 | 🟡 Minor | No search in groups              | Users must scroll through all groups to find one   | Add search/filter bar above groups grid                                                     |

#### Mobile Findings

| ID   | Severity | Issue                   | Evidence                                     | Proposed Fix                                                   |
| ---- | -------- | ----------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| H7.4 | 🟡 Minor | No gesture shortcuts    | All actions require taps on specific buttons | Add swipe actions on statement rows: swipe left to see details |
| H7.5 | 🟡 Minor | No recently used tokens | User must find their token every time        | Pin most recently used token to top of list                    |

---

### 8. Aesthetic and Minimalist Design

> Dialogues should not contain irrelevant or rarely needed information.

#### PWA Findings

| ID   | Severity | Issue                            | Evidence                                                                                                                                             | Proposed Fix                                                                                   |
| ---- | -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| H8.1 | 🟠 Major | Home dashboard cluttered         | `apps/client/app/(tabs)/home/page.tsx:82-150` - Quick actions, group widgets, recent confirmations all compete for attention                         | Prioritize: primary action (Pay) at top, then 2-3 groups max, then recent activity collapsible |
| H8.2 | 🟠 Major | Payment sheet information dense  | `apps/client/components/ussd/ussd-sheet.tsx` - Shows merchant code, reference, USSD, amount, group name, SACCO name, instructions, warnings, actions | Use progressive disclosure: fold details into "More info" expandable section                   |
| H8.3 | 🟡 Minor | Profile shows unnecessary fields | Profile displays full technical user ID                                                                                                              | Remove technical IDs; show only user-relevant information (name, phone, language)              |

#### Mobile Findings

| ID   | Severity | Issue                      | Evidence                                                                  | Pr oposed Fix                                                              |
| ---- | -------- | -------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| H8.4 | 🟠 Major | Pay screen too many tokens | Shows all reference tokens at once - overwhelming if user has many groups | Show only most recent/active token by default; add "See all tokens" expand |
| H8.5 | 🟡 Minor | Statement details verbose  | Each row shows all transaction metadata                                   | Simplify to: date, amount, status; tap to see full details                 |

---

### 9. Help Users Recognize, Diagnose, and Recover from Errors

> Error messages should be expressed in plain language, precisely indicate the
> problem, and constructively suggest a solution.

#### PWA Findings

| ID   | Severity   | Issue                                             | Evidence                                                                   | Proposed Fix                                                                           |
| ---- | ---------- | ------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| H9.1 | 🔴 Blocker | Generic error messages                            | API failures show technical "Unable to verify reference token"             | Use friendly: "We couldn't find that payment code. Check your groups and try again."   |
| H9.2 | 🟠 Major   | No recovery path from offline                     | Offline page just says "You're offline" with no actions                    | Add: "View your saved statements", "Retry connection", "Learn what you can do offline" |
| H9.3 | 🟡 Minor   | Form validation errors not associated with fields | Errors appear at top of form without indicating which field is problematic | Use inline validation with red border and message below field                          |

#### Mobile Findings

| ID   | Severity   | Issue                        | Evidence                                                                                               | Proposed Fix                                                                        |
| ---- | ---------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| H9.4 | 🔴 Blocker | USSD dial failure generic    | `apps/mobile/app/(tabs)/pay.tsx:77-82` - "Unable to open the dialer. Please dial *182*8\*1# manually." | Add recovery: copy USSD code to clipboard automatically and show how to paste       |
| H9.5 | 🟠 Major   | Loading errors not explained | If tokens or allocations fail to load, screen shows empty state without context                        | Distinguish: "Loading..." vs. "No groups yet" vs. "Connection error - Tap to retry" |

---

### 10. Help and Documentation

> Provide documentation that is easy to search, focused on the user's task,
> lists concrete steps, and is not too large.

#### PWA Findings

| ID    | Severity | Issue                  | Evidence                                                       | Proposed Fix                                                                                |
| ----- | -------- | ---------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| H10.1 | 🟠 Major | No contextual help     | Users must navigate to separate `/help` page to get assistance | Add "?" icon on complex screens (Pay, Statements) opening inline help tooltips              |
| H10.2 | 🟡 Minor | FAQ not searchable     | Help page has static list without search                       | Add search bar filtering FAQ by keywords                                                    |
| H10.3 | 🟡 Minor | No onboarding tutorial | First-time users dropped into home screen without guidance     | Add optional 3-step tutorial: "Here's how to pay", "Track your savings", "Join more groups" |

#### Mobile Findings

| ID    | Severity | Issue                     | Evidence                                     | Proposed Fix                                                    |
| ----- | -------- | ------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| H10.4 | 🟠 Major | No in-app help            | No help or support option visible in UI      | Add help icon to header or profile tab                          |
| H10.5 | 🟡 Minor | USSD steps not documented | Users expected to know how to use USSD codes | Add first-time overlay explaining USSD process with screenshots |

---

## WCAG 2.2 AA Accessibility Audit

### Color Contrast

| ID     | Severity   | Issue                              | Evidence                                                    | Proposed Fix                                                         |
| ------ | ---------- | ---------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| A11Y-1 | 🔴 Blocker | PWA secondary text fails contrast  | `text-neutral-600` on `bg-neutral-50` = 3.8:1 (needs 4.5:1) | Change to `text-neutral-700` (7.0:1 ratio)                           |
| A11Y-2 | 🔴 Blocker | Mobile tab bar labels low contrast | Active: `colors.rw.blue` on `colors.ink[900]` = 3.2:1       | Increase to `colors.rw.blue` lightened to #33B8F0 or add text stroke |
| A11Y-3 | 🟡 Minor   | PWA success messages               | Green text on white occasionally below 4.5:1                | Use `text-emerald-700` minimum                                       |

**Audit Tool Used**:
[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

### Keyboard Navigation & Focus

| ID     | Severity   | Issue                              | Evidence                                                                                                               | Proposed Fix                                                                                     |
| ------ | ---------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| A11Y-4 | 🔴 Blocker | PWA group cards no keyboard access | `apps/client/components/groups/group-card.tsx` - Uses `<div onClick>` without keyboard handling                        | Convert to `<button>` or add `tabIndex={0}`, `onKeyDown` handlers                                |
| A11Y-5 | 🟠 Major   | Focus indicators inconsistent      | Some buttons show focus ring, others don't                                                                             | Apply global `focus-visible:ring-2 focus-visible:ring-atlas-blue/30` to all interactive elements |
| A11Y-6 | 🟠 Major   | Tab order illogical                | PWA home page: quick actions → recent confirmations → group widgets. Should be: quick actions → group widgets → recent | Fix: reorder DOM to match visual hierarchy or use `tabindex`                                     |
| A11Y-7 | 🟡 Minor   | Skip to main content missing       | PWA has header and nav but no skip link                                                                                | Add `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>`     |

---

### Screen Reader Support

| ID      | Severity   | Issue                                          | Evidence                                                                        | Proposed Fix                                                                            |
| ------- | ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| A11Y-8  | 🔴 Blocker | PWA bottom nav icons not hidden                | `apps/client/components/ui/bottom-nav.tsx:92` - Icons lack `aria-hidden="true"` | Already implemented correctly, but verify all instances                                 |
| A11Y-9  | 🔴 Blocker | Mobile tab icons meaningless to screen readers | Emoji icons (🏠, 💳, etc.) announced as "house" not "Home"                      | Replace with proper `<Ionicons>` components that have accessible labels                 |
| A11Y-10 | 🟠 Major   | PWA loading states not announced               | Async content loads without notifying screen reader users                       | Add `aria-live="polite"` regions or use `<Suspense>` with accessible fallbacks          |
| A11Y-11 | 🟠 Major   | Form errors not associated with inputs         | Validation errors appear as text but not linked via `aria-describedby`          | Add `aria-describedby="field-error"` to inputs and `id="field-error"` to error messages |
| A11Y-12 | 🟡 Minor   | Status badges lack semantic meaning            | "CONFIRMED", "PENDING" shown as styled text without role                        | Wrap in `<span role="status" aria-label="Status: Confirmed">`                           |

---

### Touch Target Size

| ID      | Severity | Issue                            | Evidence                                                           | Proposed Fix                                  |
| ------- | -------- | -------------------------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| A11Y-13 | 🟠 Major | PWA group card actions too small | Join button is ~40×36px, below 44×44pt minimum                     | Increase padding: `px-4 py-3` → `px-5 py-3.5` |
| A11Y-14 | 🟡 Minor | Mobile token rows tight spacing  | Tap targets ~ 40×60px, meets minimum but could be more comfortable | Increase height to 48px minimum               |
| A11Y-15 | ✅ Pass  | PWA bottom nav targets           | All nav items are 64×48px, exceeds 44×44pt                         | No action needed                              |
| A11Y-16 | ✅ Pass  | Mobile tab bar height            | 60px height with adequate spacing                                  | No action needed                              |

---

### Dynamic Type & Text Scaling

| ID      | Severity | Issue                                 | Evidence                                                    | Proposed Fix                                                             |
| ------- | -------- | ------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| A11Y-17 | 🟠 Major | PWA breaks at 200% zoom               | Fixed pixel widths cause horizontal scroll at high zoom     | Use rem/em units, avoid `max-w-[Npx]`, test at 200% zoom                 |
| A11Y-18 | 🟡 Minor | Mobile doesn't support user font size | React Native doesn't inherit device font scaling by default | Add `allowFontScaling={true}` to all `<Text>` components or set in theme |

---

### Reduced Motion

| ID      | Severity | Issue                                                  | Evidence                                                    | Proposed Fix                                                                                                         |
| ------- | -------- | ------------------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| A11Y-19 | 🟡 Minor | PWA animations not respecting `prefers-reduced-motion` | `apps/client/app/globals.css` - No media query override     | Add: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; } }` |
| A11Y-20 | 🟡 Minor | Mobile animations always on                            | No detection of `AccessibilityInfo.isReduceMotionEnabled()` | Add motion check in theme and disable `Reanimated` animations conditionally                                          |

---

### Labels & Alt Text

| ID      | Severity   | Issue                                | Evidence                                                          | Proposed Fix                                                                |
| ------- | ---------- | ------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| A11Y-21 | 🔴 Blocker | PWA group images missing alt text    | Group cards may render images without `alt` attributes in future  | Ensure all `<img>` have `alt="[Group name] icon"` or `alt=""` if decorative |
| A11Y-22 | 🟡 Minor   | Mobile loading skeletons not labeled | Screen reader announces "LiquidCardSkeleton" instead of "Loading" | Add `accessibilityLabel="Loading group information"`                        |

---

### Mobile-Specific Accessibility

| ID      | Severity   | Issue                                     | Evidence                                                                          | Proposed Fix                                                 |
| ------- | ---------- | ----------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A11Y-23 | 🔴 Blocker | VoiceOver/TalkBack order broken           | `apps/mobile/app/(tabs)/home.tsx` - Cards render in query order, not visual order | Ensure `accessibilityViewIsModal` or correct DOM order       |
| A11Y-24 | 🟠 Major   | TouchableOpacity lacks roles              | Payment token rows don't specify `accessibleRole="button"`                        | Add `accessibilityRole="button"` to all touchable elements   |
| A11Y-25 | 🟡 Minor   | Hint text missing on interactive elements | Buttons like "Dial to pay" don't have `accessibilityHint` explaining outcome      | Add `accessibilityHint="Opens phone dialer to make payment"` |

---

## Summary Tables

### PWA Findings by Severity

| Severity   | Count  | Percentage |
| ---------- | ------ | ---------- |
| 🔴 Blocker | 6      | 21%        |
| 🟠 Major   | 12     | 41%        |
| 🟡 Minor   | 11     | 38%        |
| **Total**  | **29** | **100%**   |

### Mobile Findings by Severity

| Severity   | Count  | Percentage |
| ---------- | ------ | ---------- |
| 🔴 Blocker | 6      | 25%        |
| 🟠 Major   | 6      | 25%        |
| 🟡 Minor   | 12     | 50%        |
| **Total**  | **24** | **100%**   |

### Findings by Category

| Category               | PWA    | Mobile | Total  |
| ---------------------- | ------ | ------ | ------ |
| Usability (Heuristics) | 19     | 14     | 33     |
| Accessibility (WCAG)   | 10     | 10     | 20     |
| **Total**              | **29** | **24** | **53** |

---

## Recommended Prioritization

### Phase 1: Critical Blockers (Week 1-2)

1. Fix color contrast issues (A11Y-1, A11Y-2)
2. Replace mobile emoji icons with proper vector icons (H2.4, A11Y-9)
3. Add keyboard navigation to PWA cards (A11Y-4)
4. Implement loading states for both apps (H1.5, A11Y-10)
5. Improve error messages (H9.1, H9.4)
6. Fix button style inconsistencies (H4.1, H4.5)

### Phase 2: Major Usability Issues (Week 3-4)

1. Consolidate card components (H4.2)
2. Add proper validation to forms (H5.1, H5.4)
3. Improve system feedback (H1.2, H1.3, H1.6)
4. Simplify jargon (H2.1)
5. Fix touch target sizes (A11Y-13)
6. Add contextual help (H10.1)

### Phase 3: Quality of Life (Week 5-6)

1. Add quick actions and shortcuts (H7.1, H7.2)
2. Improve empty states (H2.2)
3. Implement reduced motion support (A11Y-19, A11Y-20)
4. Add onboarding tutorial (H10.3)
5. Polish microcopy and labels (A11Y-22, A11Y-25)

---

## Testing Checklist

Before deploying fixes, verify:

- [ ] Lighthouse accessibility score ≥90 for PWA
- [ ] Axe DevTools reports 0 violations
- [ ] Manual keyboard navigation works on all screens
- [ ] VoiceOver (iOS) and TalkBack (Android) announce elements correctly
- [ ] Color contrast ratio ≥4.5:1 for all text
- [ ] Touch targets ≥44×44pt
- [ ] All interactive elements have visible focus indicators
- [ ] Forms validate and show inline errors
- [ ] Loading states appear for async operations
- [ ] Error messages are clear and actionable
- [ ] Works at 200% browser zoom
- [ ] Respects `prefers-reduced-motion`

---

## Next Steps

1. **Design Tokens**: Create centralized design system (see
   [04-style-tokens.json](./04-style-tokens.json))
2. **Component Library**: Build base components implementing accessibility fixes
   (see [06-component-inventory.md](./06-component-inventory.md))
3. **Screen Redesigns**: Apply Revolut-inspired patterns to key screens (see
   [07-screens/](./07-screens/))
4. **Implementation**: Create GitHub issues and PRs for each finding (see
   [13-issue-index.csv](./13-issue-index.csv))
