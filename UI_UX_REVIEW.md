# SACCO+ UI/UX Review

## Navigation & Information Architecture
- **Primary navigation**: Desktop top bar with Dashboard, Ikimina, Recon, Analytics, Reports, Admin; mobile bottom nav replicates icons/labels but lacks `aria-current` and descriptive tooltips.【F:components/layout/app-shell.tsx†L158-L213】
- **Secondary actions**: Floating quick-action dialog duplicates nav entries (Create Ikimina, Import Members/Statement, Review Recon, Analytics, Reports, Profile) without context cues or progress indicators.【F:components/layout/app-shell.tsx†L201-L239】
- **Global search**: Command-k palette accessible via button/keyboard; needs focus return and results grouping by entity.
- **MFA flow**: Single-page factor chooser with dropdown and manual fetch flows; lacks step guidance and distinct states per factor.【F:app/(auth)/mfa/page.tsx†L81-L213】

## Screen Inventory & Gaps
| Area | Current State | Missing Elements |
| --- | --- | --- |
| Auth & MFA | Login form with passkey detection; MFA challenge as free-form inputs.【F:components/auth/login-form.tsx†L1-L120】【F:app/(auth)/mfa/page.tsx†L150-L213】 | Factor selection UI, backup code manager, recovery instructions, trust device disclaimers. |
| Dashboard | KPI cards, quick actions, missed contributors list, top ikimina table.【F:lib/dashboard.ts†L73-L200】 | Skeleton states, SACCO switcher, alerts/notifications, data freshness indicator. |
| Ikimina | Not reviewed in detail; assumed list/detail views. | Table virtualisation, member filters, status chips for compliance. |
| Recon | Page present, but offline/resilience states not defined. | Error/empty states, mobile-friendly import workflow. |
| Admin | Link exists but content unspecified. | Feature flag management, audit log viewer, user invitation flows. |

## Heuristic Evaluation
- **Visibility of System Status**: No loading spinners or skeletons on dashboard/recon causing blank sections; MFA initiate/verify show text but not progress indicator.【F:lib/dashboard.ts†L73-L200】【F:app/(auth)/mfa/page.tsx†L150-L213】
- **Match between system and real world**: Bilingual copy aligns with Rwandan context but quick actions mix English/Kinyarwanda in same element; consider separate lines with icons for readability.【F:components/layout/app-shell.tsx†L39-L89】
- **User Control & Freedom**: Quick actions dialog requires pointer click to close; ESC and focus trap missing. MFA trust checkbox defaults to true without explanation, risking accidental opt-in on shared devices.【F:components/layout/app-shell.tsx†L201-L239】【F:app/(auth)/mfa/page.tsx†L170-L188】
- **Error Prevention**: No confirmation before trusting device; no rate-limit feedback except generic error. CSV imports/resolution flows need inline validation (not reviewed).【F:app/(auth)/mfa/page.tsx†L185-L206】
- **Consistency & Standards**: Buttons mix uppercase tracking and sentence case; consider consistent typographic scale using tokens.【F:components/layout/app-shell.tsx†L158-L239】

## Accessibility Audit (WCAG 2.1 AA)
- **Structure**: Skip link provided, but quick actions dialog lacks focus trap & labelled close button. Add `role="dialog"`, trap focus, return focus to trigger.【F:components/layout/app-shell.tsx†L210-L239】
- **Forms**: MFA inputs missing associated labels and `aria-live` for success/error messages; implement semantic form with `<label htmlFor>` and error message relationships.【F:app/(auth)/mfa/page.tsx†L150-L213】
- **Navigation**: Add `aria-current="page"` to nav links and enlarge touch targets to ≥48px while preserving spacing.【F:components/layout/app-shell.tsx†L158-L213】
- **Dialogs/Toasts**: Quick actions & search modals should trap focus, support ESC, and announce state via `aria-live`. Toast library (sonner) should ensure screen reader announcements (verify configuration).【F:components/layout/app-shell.tsx†L201-L239】

## PWA & Mobile Readiness
- **Manifest**: No maskable icons or Apple splash images; update to meet Chrome install prompt requirements.【F:public/manifest.json†L1-L15】
- **Service Worker**: Hard-coded cache misses `_next` assets; offline nav fails beyond dashboard. Replace with workbox config, ensure navigation preload & runtime caching.【F:service-worker.js†L1-L58】
- **Install UX**: No custom install prompt; add `InstallPrompt` component triggered when PWA criteria met, with fallback instructions for iOS Safari.
- **Responsive Layout**: Mobile nav present; ensure safe-area padding for bottom nav and quick action button to avoid home indicator overlap.【F:components/layout/app-shell.tsx†L201-L221】

## Device Test Matrix (Priority)
| Device | Browser | Priority | Focus |
| --- | --- | --- | --- |
| Android mid-tier (Pixel 5) | Chrome 129 | P0 | Install prompt, offline dashboard, MFA TOTP, recon upload. |
| Android entry (Tecno Spark) | Chrome Lite/WebView | P0 | Low bandwidth performance, list virtualization, toasts. |
| iPhone 12 | Safari 18 | P0 | Add to home screen instructions, passkey auth, bottom nav safe areas. |
| iPad Mini | Safari | P1 | Split view layout, quick actions keyboard nav. |
| Windows laptop | Edge | P0 | Keyboard-only nav, Lighthouse performance, CSV upload. |
| Desktop kiosk | Chrome | P1 | Large display scaling, high contrast mode. |

## Recommended UX Enhancements
1. **MFA factor chooser**: Use segmented control with icons, show contextual instructions per factor, incorporate countdown for email/WhatsApp codes.【F:app/(auth)/mfa/page.tsx†L81-L213】
2. **Global search**: Provide sectioned results with icons and highlight matches, ensure ESC closes dialog and focus returns to trigger.【F:components/layout/app-shell.tsx†L178-L239】
3. **Quick actions**: Convert to bottom sheet on mobile with prioritized tasks (e.g., "Import Statement" first), add progress chips (e.g., pending reconciliations).【F:components/layout/app-shell.tsx†L201-L239】
4. **Dashboard skeletons & freshness**: Add shimmering placeholders and "last updated" timestamp to reinforce data trust.【F:lib/dashboard.ts†L73-L200】
5. **Accessibility compliance**: Run axe-core and fix violations (aria-current, labels, dialog focus), integrate into CI using `pnpm dlx axe-core` after start server.

