# Atlas Admin UX Review

## Inventory Snapshot

- Generated inventory of 81 route files and 109 shared components; only six
  route entries depend on the `use client` directive while 79 component files
  do, underscoring a server-first routing layer with a client-heavy component
  library.【F:analysis/ui-inventory/ui-inventory.json†L3993-L3996】
- Target IA coverage indicates strong support for "Members" and "Staff" flows,
  partial coverage for "Transactions", and no dedicated surfaces for "Accounts"
  or "Loans" yet.【F:analysis/ui-inventory/ui-inventory.json†L3997-L4055】
- Exported artifacts live in `analysis/ui-inventory/ui-inventory.json` and
  `analysis/ui-inventory/ui-inventory.csv` for downstream audit and spreadsheet
  review.【F:analysis/ui-inventory/ui-inventory.json†L1-L44】

## Component Inventory Highlights

- Admin surface templates consistently compose `GradientHeader`, `GlassCard`,
  and `StatusChip`, paired with scope-aware data panels such as approvals, audit
  trails, and notifications; these patterns repeat across `/admin/approvals`,
  `/admin/audit`, and `/admin/notifications`, signalling a reusable card-first
  layout system.【F:analysis/ui-inventory/ui-inventory.json†L137-L365】
- Member management leans on data-grid primitives: `/admin/members` is backed by
  `AdminMembersDirectory`, while the shared `MemberDirectoryCard` aggregates
  virtualization, filtering, import dialogs, and translation hooks into a single
  client
  component.【F:analysis/ui-inventory/ui-inventory.json†L320-L334】【F:analysis/ui-inventory/ui-inventory.json†L3090-L3114】
- Operations tooling hinges on rich client-side state: `ReconciliationTable`
  stitches together Supabase clients, toast/offline providers, and
  reconciliation workflows, highlighting the complexity of settlement review
  experiences.【F:analysis/ui-inventory/ui-inventory.json†L3568-L3589】

## Heuristics Review

- Heuristic sweep shows 85 client-annotated files, 17 form-heavy screens, and
  nine server-action touchpoints, with smaller counts of TODO flags, charting
  surfaces, and Suspense boundaries for progressive disclosure.【875f5f†L1-L12】
- Authentication resets (`/first-login`) exemplify client-form experiences that
  manage Supabase mutations and navigation state within the route
  layer.【F:analysis/ui-inventory/ui-inventory.json†L45-L67】
- Admin settings combines server actions with scoped forms, underlining the need
  for clear validation and rollback flows when tenants adjust configuration
  knobs.【F:analysis/ui-inventory/ui-inventory.json†L588-L620】
- Configuration screens for countries and partner integrations still expose TODO
  markers, signalling unfinished UX decisions that should be resolved before
  rollout.【F:analysis/ui-inventory/ui-inventory.json†L680-L706】【F:analysis/ui-inventory/ui-inventory.json†L1010-L1024】

## Current Information Architecture

- **Members:** Coverage spans admin directories, member group management,
  onboarding, payments, and profile upkeep, anchored by both admin and member
  workspaces.【F:analysis/ui-inventory/ui-inventory.json†L3998-L4011】
- **Staff:** Dedicated admin tooling and staff self-service flows (allocations,
  exceptions, exports, onboarding) operate in parallel, suggesting dual-entry
  points for the same capability
  set.【F:analysis/ui-inventory/ui-inventory.json†L4047-L4055】
- **Reports & Analytics:** `/admin/reports`, `/dashboard`, `/analytics`, and
  `/reports` share subscription and visualization clients, reflecting
  overlapping analytical journeys across admin
  audiences.【F:analysis/ui-inventory/ui-inventory.json†L4038-L4044】【F:analysis/ui-inventory/ui-inventory.json†L531-L555】【F:analysis/ui-inventory/ui-inventory.json†L1098-L1119】
- **Operations:** Audit and reconciliation panels centralize oversight for
  compliance and payment settlement, with reusable audit log components
  supporting both
  routes.【F:analysis/ui-inventory/ui-inventory.json†L170-L201】【F:analysis/ui-inventory/ui-inventory.json†L524-L555】
- **Settings:** Tenant and SACCO configuration surfaces span global admin,
  SACCO-level settings, and SMS pipeline toggles, emphasizing cross-tenant
  policy
  management.【F:analysis/ui-inventory/ui-inventory.json†L597-L620】【F:analysis/ui-inventory/ui-inventory.json†L4030-L4035】

## Future IA Mapping

| Target IA Area | Existing Screens                                                          | Coverage Notes                                                                                                                                                                                                                                            | Gaps & Next Steps                                                                                |
| -------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Members        | `/admin/members`, `/member/*`, `/ikimina/:id/members`                     | Robust admin/member split with shared components and import tooling.【F:analysis/ui-inventory/ui-inventory.json†L3998-L4011】【F:analysis/ui-inventory/ui-inventory.json†L320-L334】                                                                      | Consolidate duplicate member flows and ensure shared tables surface consistent metrics.          |
| Accounts       | _None_                                                                    | No dedicated account or wallet management experiences detected.【F:analysis/ui-inventory/ui-inventory.json†L4013-L4014】                                                                                                                                  | Define account hierarchy, list/detail templates, and linkages to Members and Transactions.       |
| Loans          | _None_                                                                    | Loan origination/servicing views absent from current routes.【F:analysis/ui-inventory/ui-inventory.json†L4016-L4018】                                                                                                                                     | Introduce loan pipeline dashboards and approval modals aligned with underwriting needs.          |
| Transactions   | `/admin/payments`                                                         | Single admin payments hub; relies on shared cards but lacks drill-down or ledger parity.【F:analysis/ui-inventory/ui-inventory.json†L4020-L4022】【F:analysis/ui-inventory/ui-inventory.json†L524-L555】                                                  | Extend to transaction history, disputes, and member-facing receipts.                             |
| Operations     | `/admin/audit`, `/admin/reconciliation`                                   | Compliance and settlement workflows well-defined with shared audit components.【F:analysis/ui-inventory/ui-inventory.json†L170-L201】【F:analysis/ui-inventory/ui-inventory.json†L4024-L4028】                                                            | Layer in proactive monitoring (alerts, anomaly detection) and connect to future Transactions IA. |
| Reports        | `/admin/reports`, `/dashboard`, `/analytics`, `/reports`                  | Multiple entry points reuse subscription clients, causing potential duplication.【F:analysis/ui-inventory/ui-inventory.json†L531-L555】【F:analysis/ui-inventory/ui-inventory.json†L4038-L4044】【F:analysis/ui-inventory/ui-inventory.json†L1098-L1119】 | Rationalize to a single analytics home with role-based lenses.                                   |
| Staff          | `/admin/staff`, `/staff/*`                                                | Admin provisioning overlaps with staff self-service screens, indicating role ambiguity.【F:analysis/ui-inventory/ui-inventory.json†L629-L647】【F:analysis/ui-inventory/ui-inventory.json†L1210-L1239】                                                   | Clarify portal separation and navigation to avoid duplicate workflows.                           |
| Settings       | `/admin/settings`, `/ikimina/:id/settings`, SMS consent/ingestion toggles | Multi-level settings exist but require better hierarchy cues and guardrails for bulk edits.【F:analysis/ui-inventory/ui-inventory.json†L597-L620】【F:analysis/ui-inventory/ui-inventory.json†L4030-L4035】                                               | Map dependencies (notifications, security) and align to new Accounts/Transactions areas.         |

## UX Risks & Opportunities

- **Unmapped surfaces:** 51 routes fall outside the target IA, creating
  navigation debt that should be resolved as the future structure
  solidifies.【55995e†L1-L9】【F:analysis/ui-inventory/ui-inventory.json†L4058-L4085】
- **Client-heavy components:** A large portion of the shared library depends on
  `use client`, increasing hydration cost and complicating streaming; prioritise
  server-compatible refactors where
  possible.【F:analysis/ui-inventory/ui-inventory.json†L3993-L3996】【875f5f†L1-L12】
- **Form & server action ergonomics:** Mission-critical flows (auth resets,
  tenant settings) rely on bespoke form logic and server actions; invest in
  shared validation, optimistic UI patterns, and audit
  trails.【F:analysis/ui-inventory/ui-inventory.json†L45-L67】【F:analysis/ui-inventory/ui-inventory.json†L588-L620】
- **Incomplete configurations:** Country and partner management retain TODO
  placeholders, signalling blocked decision paths for localization and
  integration
  settings.【F:analysis/ui-inventory/ui-inventory.json†L680-L706】【F:analysis/ui-inventory/ui-inventory.json†L1010-L1024】
- **Duplicated analytics & staff access:** Both admin and general routes expose
  report and staff management flows, risking fragmented permissions and
  inconsistent
  dashboards.【F:analysis/ui-inventory/ui-inventory.json†L531-L555】【F:analysis/ui-inventory/ui-inventory.json†L1098-L1119】【F:analysis/ui-inventory/ui-inventory.json†L629-L647】【F:analysis/ui-inventory/ui-inventory.json†L1210-L1239】
- **High-complexity operations UI:** Components like `ReconciliationTable`
  orchestrate Supabase, offline queues, and toasts; ensure performance budgets
  and error handling cover low-connectivity staff
  scenarios.【F:analysis/ui-inventory/ui-inventory.json†L3568-L3589】

## Next Steps

1. Align product stakeholders on the future IA, prioritising net-new Accounts
   and Loans surfaces before adding more variants to existing categories.
2. Rationalise duplicate entry points (reports, staff) by consolidating
   navigation and permissions.
3. Harden critical forms with shared validation utilities and confirm TODO
   hotspots to reach production readiness.
4. Evaluate client-heavy components for partial server rendering or skeleton
   strategies to curb hydration costs in the admin dashboard.
