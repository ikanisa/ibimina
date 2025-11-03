# Atlas Admin UX Specification

## Product Intent

Atlas admin centralizes portfolio monitoring, risk mitigation, and customer
servicing workflows for SACCO+ operations. The experience must provide
at-a-glance status, rapid drill-in, and guard-railed actioning for high-risk
flows while supporting bilingual operations (en/rw) and offline-tolerant data
entry.

## Experience Principles

1. **Operational clarity** – highlight SLA breaches and pending approvals
   without overwhelming the operator.
2. **Progressive disclosure** – keep high-impact actions behind confirmation
   steps and contextual education.
3. **Auditability** – ensure every data mutation is attributable with
   justifications captured inline.
4. **Resilience** – optimistic UI with deterministic fallback states for
   intermittent connectivity.

## System Architecture Summary

| Layer           | Responsibility                                         | Key Modules                                                                  |
| --------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Presentation    | Routing, layout, navigation, shared providers          | `apps/admin/src/AppShell.tsx`, `apps/admin/src/routes/**/*`, `packages/ui-*` |
| Domain services | Data fetching, caching, optimistic updates             | `packages/data-*`, Supabase client wrappers, background sync workers         |
| Platform        | Auth, feature flagging, telemetry                      | `packages/platform-auth`, `packages/feature-flags`, `packages/observability` |
| Infrastructure  | Supabase functions, queue workers, reporting warehouse | Supabase RPC endpoints (`atlas_*`), Cloudflare queues, Metabase exports      |

## Component Inventory & Ownership

| Component              | Owner package          | Props contract                                                  | State management                               | Notes                                                |
| ---------------------- | ---------------------- | --------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `DashboardMetrics`     | `apps/admin`           | `{ timeframe: DateRange; }`                                     | React Query + SWR fallback                     | surfaces KPI cards; respects locale-specific formats |
| `TaskList`             | `apps/admin`           | `{ filter: TaskFilter }`                                        | React Query + Zustand                          | integrates with command palette quick actions        |
| `MemberDirectoryTable` | `packages/ui-data`     | `{ columns: ColumnDef[]; data: Member[] }`                      | Column virtualization with windowed pagination | enforces role-based column visibility                |
| `MemberProfileLayout`  | `apps/admin`           | `{ memberId: string }`                                          | React Router loader + suspense boundary        | hosts summary header + timeline                      |
| `LoanPortfolioTable`   | `packages/ui-data`     | `{ segment: PortfolioSegment }`                                 | React Query + streaming updates                | includes sticky insights row                         |
| `RiskCaseBoard`        | `packages/ui-kanban`   | `{ cases: CaseCard[] }`                                         | Drag controller + audit logging                | board actions gated by permissions                   |
| `AtlasCommandPalette`  | `apps/admin`           | `{ isOpen: boolean }`                                           | Zustand store + keyboard shortcuts             | translates command labels via i18n namespace         |
| `BlockingDialog`       | `packages/ui-feedback` | `{ title: string; description: string; onConfirm: () => void }` | Local state + analytics events                 | used for destructive actions                         |

## Information Architecture & Routing

```
/admin
  ├─ dashboard (default index)
  ├─ members
  │   ├─ index (search + directory)
  │   └─ :id (profile, loans, KYC, audit)
  ├─ loans
  │   ├─ index (portfolio + delinquency board)
  │   └─ :id (loan details, repayment history, restructuring)
  ├─ collections (field team planning)
  ├─ risk (investigation kanban + escalations)
  ├─ settings
  │   ├─ org
  │   ├─ users
  │   ├─ notifications
  │   └─ integrations
  └─ support (knowledge base, feedback)
```

## Screen Blueprints (Before → After)

| Screen             | Legacy Pain Points                       | Atlas Solution                                                | Screenshot                                                                                    |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Dashboard          | Fragmented KPIs, no SLA context          | Unified KPI tiles, SLA breach banner, contextual alerts       | ![Atlas dashboard](attached_assets/Screenshot%202025-11-01%20at%2011.04.51_1761991494807.png) |
| Member profile     | Deep drill-downs, no persistent timeline | Tabbed layout, sticky activity timeline, quick task shortcuts | ![Member profile](attached_assets/Screenshot%202025-11-02%20at%2021.11.51_1762114314408.png)  |
| Loan delinquency   | Static table, manual exports             | Interactive matrix, saved filters, assign-in-place controls   | ![Loan matrix](attached_assets/Screenshot%202025-11-02%20at%2021.11.36_1762114299763.png)     |
| Risk investigation | Multiple tabs, manual evidence tracking  | Kanban board, inline evidence viewer, SLA timers              | ![Risk board](attached_assets/Screenshot%202025-11-02%20at%2021.12.05_1762114328097.png)      |

_Screenshot assets reside in `attached_assets/` and should be included in
release packaging._

## Design Tokens & Interaction Specs

- **Color**: `atlas.blue`, `atlas.teal`, `atlas.slate`, `atlas.green`,
  `atlas.amber`, `atlas.red`. Dark mode accent pairings documented in
  `packages/tokens/dark.ts`.
- **Typography**: Inter with fallback `system-ui`. Body copy 16px/24px, small
  text 14px/20px, caption 13px/20px. Titles use 600 weight; numbers use tabular
  lining.
- **Iconography**: `packages/icons` with 20px/24px grid. Critical actions
  require filled variant + text label.
- **Motion**: Enter/exit limited to 120ms ease-out for list updates, 200ms
  ease-in-out for modal transitions. Respect `prefers-reduced-motion`.
- **Hit targets**: Minimum 40px height for actionable items; checkboxes 32px
  target with 16px visual glyph.
- **Focus**: Dual ring (outer #0046D5, inner #FFFFFF) with 2px spread.

## Accessibility & Internationalization Requirements

- Lighthouse a11y ≥ 95 on `/admin` and `/admin/members/:id`.
- Keyboard coverage validated via Playwright `a11y.spec.ts` for main flows.
- All charts provide textual summaries via `aria-describedby` linking to hidden
  `<dl>` components.
- Strings stored in `locales/en/atlas-admin.json` and
  `locales/rw/atlas-admin.json`; no inline literals.
- Currency and date formatting respect organization defaults from
  `platform-settings` service.

## Performance Budgets

| Metric               | Budget                    | Measurement                                                            |
| -------------------- | ------------------------- | ---------------------------------------------------------------------- |
| LCP                  | ≤ 2.5s on 3G Fast         | Collected via `apps/admin/src/observability/webVitals.ts` → Prometheus |
| TTI                  | ≤ 3.0s                    | RUM events + Lighthouse CI                                             |
| Main thread blocking | ≤ 150ms during navigation | Chrome trace recorded in `artifacts/perf`                              |
| Data fetch SLA       | API median < 400ms        | Supabase query insights dashboard                                      |

## Regression Suite Inventory

- **Automated**
  - Playwright flows: dashboard smoke, member search, loan delinquency triage,
    risk case update.
  - Jest unit suites for UI packages (`packages/ui-*`).
  - Pa11y CI for `/admin` + `/admin/loans`.
- **Manual**
  - Accessibility spot checks with VoiceOver/NVDA.
  - Locale regression (en ↔ rw) on member profile & task creation.
  - Offline simulation using Chrome dev tools for collections visit logging.

## Route ↔ Component Matrix

| Route                | Layout                | Primary Widgets                                                 | Notes                                     |
| -------------------- | --------------------- | --------------------------------------------------------------- | ----------------------------------------- |
| `/admin`             | `DashboardLayout`     | `DashboardMetrics`, `TaskList`, `ActivityFeed`                  | Activity feed virtualized to 200 entries  |
| `/admin/members`     | `DirectoryLayout`     | `MemberDirectoryTable`, `SavedViewsPanel`                       | Bulk export triggers background job       |
| `/admin/members/:id` | `MemberProfileLayout` | `ResourceSummaryHeader`, `ActivityTimeline`, `CaseNotesPanel`   | Supports inline document upload           |
| `/admin/loans`       | `LoanPortfolioLayout` | `LoanPortfolioTable`, `RiskHeatmap`, `CollectionsSidebar`       | Heatmap uses canvas rendering             |
| `/admin/loans/:id`   | `LoanDetailLayout`    | `RepaymentHistoryChart`, `RestructureWizard`, `CollateralPanel` | Chart fallback is table view              |
| `/admin/collections` | `CollectionsLayout`   | `RoutePlannerMap`, `VisitOutcomeForm`                           | Map tiles cached for offline              |
| `/admin/risk`        | `RiskLayout`          | `RiskCaseBoard`, `EvidenceGallery`, `BlockingDialog`            | Board actions log to compliance store     |
| `/admin/settings`    | `SettingsLayout`      | `SettingsNavigation`, `FormCard`, `AuditTrackedToggle`          | Autosave disabled; explicit save required |
| `/admin/support`     | `SupportLayout`       | `KnowledgeBaseLinks`, `FeedbackForm`, `IncidentTimeline`        | Feedback posts to Slack webhook           |

## Screenshot Capture Log

| Asset                                                                       | Route                | Description            | Source                       |
| --------------------------------------------------------------------------- | -------------------- | ---------------------- | ---------------------------- |
| `attached_assets/Screenshot%202025-10-31%20at%2014.12.26_1761916350683.png` | Legacy dashboard     | Baseline reference     | Legacy admin                 |
| `attached_assets/Screenshot%202025-11-01%20at%2011.04.51_1761991494807.png` | `/admin`             | Final dashboard layout | Atlas admin build 2025-11-01 |
| `attached_assets/Screenshot%202025-11-02%20at%2021.11.36_1762114299763.png` | `/admin/loans`       | Delinquency matrix     | Atlas admin build 2025-11-02 |
| `attached_assets/Screenshot%202025-11-02%20at%2021.11.51_1762114314408.png` | `/admin/members/:id` | Member profile         | Atlas admin build 2025-11-02 |
| `attached_assets/Screenshot%202025-11-02%20at%2021.12.05_1762114328097.png` | `/admin/risk`        | Risk case board        | Atlas admin build 2025-11-02 |

## Release Validation Alignment

- Reference `docs/go-live/release-checklist.md` for Atlas-specific validations
  added in this update.
- Update `docs/go-live/final-validation.md` with Atlas regression evidence links
  prior to tagging.
- Ensure `CHANGELOG.md` entries reference Atlas admin rollout and associated QA
  artifacts.

## Open Questions

- Should command palette expose configuration entities in MVP? Pending security
  review.
- Offline collections sync handshake still requires QA sign-off.

Keep this specification aligned with `docs/atlas-admin-ux-review.md`.
Differences must be reconciled during weekly design system triage.
