# SACCO+ Member App Implementation Guide

This document translates the high-level product brief into a phased delivery
plan for the SACCO+ member-facing progressive web application (PWA). The guide
covers architecture, feature scope, sequencing, and validation to ensure a
smooth path from prototype to production deployment on your chosen hosting
platform.

## 1. Experience Pillars

- **Mobile-first, installable PWA** with 16:9 tablet support and persistent
  bottom navigation.
- **Icon-first presentation** that favors large tap targets (≥48px), bold
  iconography, and short textual labels.
- **High-contrast “liquid glass” visuals** over the Rwanda gradient background.
- **Fast and forgiving onboarding**: minimal forms, no OTP, smart defaults, and
  device memory for repeated actions.
- **Privacy-first data access**: members only see sensitive information for
  groups they belong to.

## 2. Information Architecture

| Route             | Description                                            | Primary Components                                      |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| `/(auth)/welcome` | Greeting, CTA to onboarding                            | `Hero`, `PrimaryCTA`                                    |
| `/(auth)/onboard` | Collect WhatsApp & MoMo numbers, ID upload, OCR review | `NumberCaptureForm`, `IDUploadSheet`, `OCRReview`       |
| `/`               | Home dashboard with group carousel, tips, and activity | `IkiminaWidget`, `RecentActivity`, `SmartTipCard`       |
| `/saccos`         | Manage linked SACCOs and add new ones                  | `SearchWithSemantic`, `SaccoChipList`                   |
| `/groups`         | Cross-SACCO group explorer                             | `IkiminaGrid`, `JoinRequestDialog`                      |
| `/groups/[id]`    | Group summary, members (guarded), statements           | `GroupHeader`, `MembersList`, `StatementTabs`           |
| `/pay`            | USSD instructions and confirmation                     | `USSDSheet`, `PaymentSteps`                             |
| `/profile`        | Member profile settings & preferences                  | `ProfileForm`, `DocumentManager`, `NotificationToggles` |

### Bottom Navigation

1. Home (🏠)
2. Groups (👥)
3. SACCOs (🏦)
4. Pay (💸)
5. Profile (🧑)

The navigation bar remains visible after onboarding, providing one-thumb access
to each domain.

## 3. Data Model Extensions

Supabase migrations must introduce the following tables with row-level security
(RLS) policies:

- `members_app_profiles`
- `user_saccos`
- `join_requests`
- `group_invites`
- `notifications`

Each table follows the schema defined in the product brief. Policies must ensure
users interact only with their own records, while staff maintain elevated
visibility via the existing admin tooling.

## 4. API Surface (Next.js App Router)

All endpoints reside under `/app/api`. Handlers use Zod for validation and
Supabase server-side clients for privileged operations.

### Onboarding & Identity

- `POST /api/onboard`
- `POST /api/ocr/upload`
- `GET /api/memberships/sync`

### SACCOs & Groups

- `GET /api/saccos/search`
- `POST /api/saccos/add`
- `GET /api/groups`
- `GET /api/groups/:id/summary`
- `GET /api/groups/:id/members`
- `POST /api/groups/:id/join-request`
- `POST /api/invite/accept`

### Payments & Activity

- `GET /api/pay/ussd-params`
- `GET /api/activity/recent`

## 5. Component Inventory

| Component            | Responsibility                                                          |
| -------------------- | ----------------------------------------------------------------------- |
| `IkiminaWidget`      | Displays group metadata, statistics, and action buttons.                |
| `USSDSheet`          | Summarizes merchant + reference codes and provides tel: links.          |
| `SearchWithSemantic` | Autocomplete input backed by semantic search API.                       |
| `MemberList`         | Protected list rendering member avatars, names, and last contributions. |
| `Toast`              | Accessible feedback component using `aria-live`.                        |
| `Dialog`             | Base dialog for join requests and invite acceptance flows.              |

## 6. Feature Sprints

### Sprint 1 — Shell & Onboarding (Week 1)

- Layout scaffolding, theming, bottom navigation, and shared design tokens.
- Onboarding flow (numbers → ID upload → OCR → review → profile create).
- Implement `/api/onboard`, `/api/ocr/upload`, and `/api/memberships/sync`.
- PWA manifest and service worker (stale-while-revalidate strategy).

### Sprint 2 — SACCO & Group Discovery (Week 2)

- Semantic SACCO search, chip list management, `user_saccos` persistence.
- Group explorer across user SACCOs using `IkiminaWidget` grid.
- Join request dialog and `/api/groups/:id/join-request` endpoint.

### Sprint 3 — Group Detail & Payments (Week 3)

- Group detail page with summary metrics, statements, guarded member list.
- USSD payment sheet, `/api/pay/ussd-params`, and recent activity feed.
- Logging of pending payments for reconciliation.

### Sprint 4 — Invites & Notifications (Week 4)

- Invite acceptance flow and `/api/invite/accept` handler.
- Notification delivery and settings management.
- Accessibility polishing, localization (rw/en/fr), and Lighthouse tuning.

## 7. Testing & Quality Gates

- **Unit tests** for component rendering and API validation logic (Vitest/React
  Testing Library).
- **Playwright E2E** scenarios: onboarding, add SACCO, request to join, USSD
  payment, invite acceptance.
- **Lighthouse CI** targeting ≥90 scores for Performance, Accessibility, and PWA
  categories.

## 8. Deployment Checklist (Self-Hosted or Managed Platform)

1. Configure Supabase service role keys and storage buckets as environment
   variables in your deployment target.
2. Ensure service worker and manifest paths are correct for production domains.
3. Add edge function endpoints (if used) to Supabase project with proper
   permissions.
4. Validate RLS policies in staging before promoting to production.
5. Confirm Playwright tests pass in CI and Lighthouse meets acceptance
   thresholds.

---

_This guide consolidates the product requirements into actionable engineering
steps to deliver the SACCO+ member experience reliably and securely._
