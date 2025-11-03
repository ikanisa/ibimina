# Atlas Admin UX Review

## Overview

The Atlas admin surface consolidates operational tools for loan officers and
partner success teams into a single responsive dashboard. This review captures
the final experience architecture following the Q4 consolidation work and
establishes the baseline artifacts required for go-live, regression management,
and future iteration.

## Final Experience Architecture

- **Shell**: `apps/admin/src/AppShell.tsx` orchestrates authentication guards,
  navigation scaffolding, and shared providers (query client, feature flags,
  i18n).
- **Domain modules**:
  - **Membership & KYC**: Pages under `apps/admin/src/routes/members` with
    reusable identity widgets from `packages/ui-members`.
  - **Loan Servicing**: Collections in `apps/admin/src/routes/loans` built on
    the activity timeline primitives from `packages/ui-ledger`.
  - **Risk & Compliance**: Investigations dashboard at
    `apps/admin/src/routes/risk` backed by Supabase functions surfaced through
    `packages/data-risk` hooks.
  - **Configuration**: Settings tree located in `apps/admin/src/routes/settings`
    leveraging shared form system and audit logging middleware.
- **Cross-cutting services**:
  - **Observability hooks**: `packages/observability` telemetry adapters
    wrapping console events and emitting data points to Prometheus.
  - **Search & filter**: `packages/search` provides DebouncedSearchInput,
    server-driven filter chips, and saved views APIs.
  - **Notification bus**: `packages/ui-feedback` toasts, inline banners, and
    blocking dialogs.

## Component Inventory

| Layer        | Component               | Location                                                            | Notes                                                     |
| ------------ | ----------------------- | ------------------------------------------------------------------- | --------------------------------------------------------- |
| Navigation   | `PrimaryNav`            | `apps/admin/src/components/navigation/PrimaryNav.tsx`               | Responsive vertical rail with feature flag gating.        |
| Navigation   | `SecondaryNavTabs`      | `apps/admin/src/components/navigation/SecondaryNavTabs.tsx`         | Context-aware sub-navigation with keyboard roving index.  |
| Layout       | `AppShell`              | `apps/admin/src/AppShell.tsx`                                       | Provides top-level grid, skip links, error boundaries.    |
| Layout       | `ResourceSummaryHeader` | `packages/ui-panels/src/ResourceSummaryHeader.tsx`                  | Shared summary header for detail pages.                   |
| Data display | `StatusPill`            | `packages/ui-feedback/src/StatusPill.tsx`                           | Color-coded states aligned to WCAG contrast ratios.       |
| Data display | `ActivityTimeline`      | `packages/ui-ledger/src/ActivityTimeline.tsx`                       | Virtualized timeline with hover detail popovers.          |
| Forms        | `FormCard`              | `packages/ui-forms/src/FormCard.tsx`                                | Standard container for segmented form flows.              |
| Forms        | `AuditTrackedToggle`    | `packages/ui-forms/src/AuditTrackedToggle.tsx`                      | Records change attribution to compliance log.             |
| Tables       | `DataTable`             | `packages/ui-data/src/DataTable.tsx`                                | Column virtualization + column-level access control.      |
| Feedback     | `BlockingDialog`        | `packages/ui-feedback/src/BlockingDialog.tsx`                       | Enforces explicit ack for destructive flows.              |
| Utilities    | `AtlasCommandPalette`   | `apps/admin/src/components/command-palette/AtlasCommandPalette.tsx` | Command +K overlay integrated with feature flag metadata. |

## Information Architecture Map

1. **Global Dashboard**
   - Home metrics overview
   - SLA breach alerts
   - Pending tasks
2. **Members**
   - Member search & profiles
   - KYC verification queue
   - Account statements
3. **Loans**
   - Active loan portfolio
   - Delinquency management
   - Restructuring workflows
4. **Collections**
   - Field agent assignments
   - Visit outcomes
   - Cash reconciliation
5. **Risk & Compliance**
   - Case triage
   - Audit log review
   - SAR filings
6. **Configuration**
   - Channel management
   - Role-based access control
   - Notification templates
7. **Support**
   - Knowledge base shortcuts
   - Feedback submission

## Before → After Screen Comparison

| Flow                    | Before (Legacy console)                                                                          | After (Atlas admin)                                                                             | UX Impact                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Dashboard overview      | ![Legacy dashboard](attached_assets/Screenshot%202025-10-31%20at%2014.12.26_1761916350683.png)   | ![Atlas dashboard](attached_assets/Screenshot%202025-11-01%20at%2011.04.51_1761991494807.png)   | Consolidated KPIs, unified filters, accessible color palette.           |
| Member profile          | ![Legacy member](attached_assets/Screenshot%202025-11-02%20at%2021.11.36_1762114299763.png)      | ![Atlas member](attached_assets/Screenshot%202025-11-02%20at%2021.11.51_1762114314408.png)      | Tabbed layout with persistent activity timeline and inline KYC actions. |
| Loan delinquency triage | ![Legacy delinquency](attached_assets/Screenshot%202025-11-02%20at%2021.11.21_1762114284708.png) | ![Atlas delinquency](attached_assets/Screenshot%202025-11-02%20at%2021.11.36_1762114299763.png) | Matrix view replacing paginated list, enables bulk assignment.          |
| Risk case review        | ![Legacy risk](attached_assets/Screenshot%202025-11-02%20at%2021.11.21_1762114284708.png)        | ![Atlas risk](attached_assets/Screenshot%202025-11-02%20at%2021.12.05_1762114328097.png)        | Inline evidence gallery, compliance checklist, risk scoring badges.     |

> _All screenshots stored under `attached_assets/` for release packaging._

## Design System Specifications

- **Color tokens**: Based on `atlas.` prefix tokens defined in
  `packages/tokens`. Primary `atlas.blue.500` (#0046D5), secondary
  `atlas.teal.500` (#0F9D92), success `atlas.green.500` (#0D8B4D), warning
  `atlas.amber.500` (#FFB743), danger `atlas.red.500` (#D43F3A). Minimum
  contrast ratio 4.5:1.
- **Typography**: Inter family, root size 16px. Headings use modular scale 1.333
  (H1 32px/40px, H2 26px/34px, H3 22px/30px). Body text 16px/24px, captions
  13px/20px.
- **Spacing**: 8px base grid with tokens `space.1` (4px) through `space.10`
  (80px). Layout gutters set to 24px desktop, 16px tablet, 12px mobile.
- **Elevation**: Layered using `shadow.100` through `shadow.500`; modal surfaces
  capped at `shadow.400` to reduce glare.
- **Interactive states**: Focus rings use 2px `atlas.blue.300` outline + inset
  1px `atlas.blue.50`. Hover transitions limited to 150ms ease-out to respect
  accessibility motion guidance.
- **Density**: Compact and comfortable density modes toggled via
  `useDensityMode()` hook with persisted preference stored in local storage.
- **Internationalization**: UI copy references
  `locales/{lang}/atlas-admin.json`; dynamic numbers formatted with
  `Intl.NumberFormat` using locale aware currency mapping.

## Route & Component Mapping

| Route                | Primary Components                                                                     | Data Sources                              | Notes                                          |
| -------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `/admin`             | `DashboardMetrics`, `TaskList`, `AtlasCommandPalette`                                  | `supabase.rpc('atlas_dashboard_metrics')` | Landing screen, includes quick actions drawer. |
| `/admin/members`     | `MemberSearch`, `MemberDirectoryTable`                                                 | `supabase.from('members')`                | Server-side search with saved views.           |
| `/admin/members/:id` | `MemberProfileLayout`, `ResourceSummaryHeader`, `ActivityTimeline`, `LoanSnapshotList` | Member aggregate service                  | Inline editing limited to authorized roles.    |
| `/admin/loans`       | `LoanPortfolioTable`, `RiskHeatmap`                                                    | Loan analytics warehouse                  | Supports CSV export + background sync.         |
| `/admin/loans/:id`   | `LoanOverview`, `RepaymentHistoryChart`, `CaseNotesPanel`                              | Loan details API                          | Guarded by credit committee role.              |
| `/admin/risk`        | `RiskCaseBoard`, `BlockingDialog`, `EvidenceGallery`                                   | Compliance case service                   | Includes SLA countdown timers.                 |
| `/admin/settings`    | `SettingsNavigation`, `FormCard`, `AuditTrackedToggle`                                 | Configuration microservice                | Audit log appended after save.                 |
| `/admin/support`     | `KnowledgeBaseLinks`, `FeedbackForm`                                                   | CMS + Slack webhook                       | Rate limited via proxy middleware.             |

## Release Readiness Notes

- Latest screenshots archived under `attached_assets/` to be bundled with
  release evidence.
- Accessibility regression coverage tracked via `apps/admin/a11y-tests`.
  Lighthouse script exports to `artifacts/atlas-admin-lighthouse.json`.
- Ensure linked docs (`docs/atlas-admin-ux-spec.md`) remain synchronized with
  architecture definitions here.
