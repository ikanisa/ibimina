# SACCO+ UI/UX Review

## Navigation & Information Architecture

- **Primary navigation**: Desktop nav exposes Dashboard, Ikimina, Recon,
  Analytics, Ops, Reports, Admin, but lacks `aria-current` and screen-reader
  announcements; mobile bottom nav mirrors items while a floating quick-action
  button toggles modal actions.【F:components/layout/app-shell.tsx†L166-L278】
- **Quick actions**: Modal lists bilingual actions
  (Create/Import/Recon/Analytics/Reports/Profile) but behaves like duplicated
  navigation with no keyboard focus trap or ESC support, making it difficult on
  mobile assistive tech.【F:components/layout/app-shell.tsx†L238-L278】
- **Global search**: Dialog fetches ikimina, members, payments and caches
  results but lacks section headings for screen readers and requires better
  grouping; focus is set when opened but closing does not restore focus to
  trigger.【F:components/layout/global-search-dialog.tsx†L1-L120】
- **MFA flow**: AuthX MFA page offers segmented control with factor
  descriptions, trust-device checkbox, and error/message banners, yet relies on
  API behaviour that doesn’t enforce throttling or error focus, leaving users
  guessing after invalid attempts.【F:app/(auth)/mfa/page.tsx†L81-L213】

## Screen Inventory & Gaps

| Area            | Current State                                                                                                                                                               | Missing Elements                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth & MFA      | Login uses legacy `/api/mfa` flow; AuthX page provides factor chooser and live regions.【F:components/auth/login-form.tsx†L214-L279】【F:app/(auth)/mfa/page.tsx†L81-L213】 | Unified factor framework, trusted device copy, error autofocus, recovery docs.                                                                                    |
| Dashboard       | KPI cards + top ikimina list + missed contributors; no skeletons during Supabase fetch.【F:lib/dashboard.ts†L74-L200】                                                      | Loading skeletons, last-updated timestamp, quick filters, offline fallback.                                                                                       |
| Ikimina & Recon | Not audited in depth; rely on same shell.                                                                                                                                   | Virtualised tables, filter chips, error/empty states.                                                                                                             |
| Admin/Ops       | Links exist but content unspecified.                                                                                                                                        | Policy management UI, audit log viewer, branch DB status board.                                                                                                   |
| Error states    | Branded 404 and offline fallback now live; dashboards still show blank states during fetch.                                                                                 | Extend cached API shell and add contextual empty states per module.【F:app/not-found.tsx†L1-L86】【F:app/offline/page.tsx†L1-L49】【F:lib/dashboard.ts†L74-L200】 |

## Heuristic Evaluation (Nielsen)

- **Visibility of system status**: MFA shows inline text but no spinner or
  countdown; dashboard loads blank during data fetch with no skeleton or
  shimmer.【F:app/(auth)/mfa/page.tsx†L150-L213】【F:lib/dashboard.ts†L74-L200】
- **User control & freedom**: Quick actions modal requires pointer click to
  dismiss, lacks ESC handler, and traps focus; trust-device checkbox defaults
  differ between flows without
  explanation.【F:components/layout/app-shell.tsx†L238-L278】【F:components/auth/login-form.tsx†L248-L279】
- **Consistency & standards**: Mixed-case typography and bilingual duplication
  reduce scanability; nav lacks active state indicators for assistive
  tech.【F:components/layout/app-shell.tsx†L166-L278】
- **Error prevention**: AuthX verify does not throttle or warn on rapid retries;
  WhatsApp channel lacks UI rate-limit messaging; trusting a device on shared
  hardware is one click without
  warning.【F:app/(auth)/mfa/page.tsx†L168-L206】【F:lib/authx/start.ts†L83-L122】

## Accessibility Audit (WCAG 2.1 AA)

- **Structure**: Skip link provided, but quick actions dialog needs
  `role="dialog"` focus trap and labelled close button; install banner uses
  non-modal dialog without focus
  management.【F:components/layout/app-shell.tsx†L238-L278】【F:components/system/add-to-home-banner.tsx†L21-L46】
- **Navigation**: Add `aria-current` to nav links and ensure bottom nav buttons
  meet ≥48 px touch targets; restore focus after closing
  modals.【F:components/layout/app-shell.tsx†L166-L223】
- **Forms**: MFA inputs have labels and live regions, but errors should shift
  focus to the field, and passkey failure needs alternate
  instructions.【F:app/(auth)/mfa/page.tsx†L150-L213】
- **Dialogs/Toasts**: Global search should announce result sections and return
  focus to trigger; toasts rely on Sonner defaults—confirm screen-reader
  announcements.【F:components/layout/global-search-dialog.tsx†L1-L120】

## PWA & Mobile Readiness

- **Service worker**: Stale-while-revalidate caching covers shell, manifest, and
  icons but dynamic data still requires live Supabase calls; add cached API
  strategy for dashboards.【F:service-worker.js†L1-L98】
- **Install UX**: Install banner appears when criteria met, but lacks keyboard
  dismissal and analytics on
  conversions.【F:components/system/add-to-home-banner.tsx†L21-L46】
- **Responsive layout**: Mobile nav uses bottom bar plus floating action button;
  ensure safe-area padding and focus order for
  accessibility.【F:components/layout/app-shell.tsx†L209-L278】
- **Offline fallback**: `/offline` page exists with brand messaging, yet
  dashboards lack cached data or skeleton states when
  offline.【F:app/offline/page.tsx†L1-L49】【F:lib/dashboard.ts†L74-L200】

## Device Test Matrix (Priority)

| Device                     | Browser     | Priority | Focus                                                                               |
| -------------------------- | ----------- | -------- | ----------------------------------------------------------------------------------- |
| Android mid-tier (Pixel 6) | Chrome 129  | P0       | Install banner, offline dashboard, AuthX MFA TOTP & passkey fallback.               |
| Android entry (Tecno)      | Chrome Lite | P0       | Performance on slow networks, WhatsApp/email OTP flows, quick actions keyboard nav. |
| iPhone 12                  | Safari 18   | P0       | Passkey + Add to Home instructions, bottom nav safe area, trust device copy.        |
| Windows laptop             | Edge        | P0       | Keyboard-only nav, global search results grouping, CSV import (not audited).        |
| iPad Mini                  | Safari      | P1       | Split view layout, quick actions accessibility.                                     |
| Desktop kiosk              | Chrome      | P1       | High contrast mode, large typography scaling.                                       |

## Recommended UX Enhancements

1. **Unify MFA experience**: Route login through AuthX APIs, add passkey/TOTP
   fallback messaging, autofocus on errors, and provide retry countdown for
   email/WhatsApp
   codes.【F:components/auth/login-form.tsx†L214-L279】【F:app/(auth)/mfa/page.tsx†L150-L213】
2. **Accessible quick actions**: Convert modal to focus-trapped dialog with ESC
   support, highlight contextual tasks (recon queue, pending imports) instead of
   duplicating navigation.【F:components/layout/app-shell.tsx†L238-L278】
3. **Skeletons & freshness**: Add shimmer placeholders and “Last updated”
   timestamps for dashboard widgets to reinforce data trust during fetch
   delays.【F:lib/dashboard.ts†L74-L200】
4. **Offline UX**: Expand offline fallback by caching `_next` assets and key API
   responses; surface toast/banner when operating on cached data to prompt sync
   when back
   online.【F:service-worker.js†L1-L98】【F:app/offline/page.tsx†L1-L49】
5. **Global search semantics**: Group results by entity with headings, announce
   counts, and restore focus after closing to satisfy WCAG
   2.4.3.【F:components/layout/global-search-dialog.tsx†L1-L120】
