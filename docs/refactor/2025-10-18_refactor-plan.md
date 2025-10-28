# Ibimina Refactor Plan — Admin Guardrails & Edge Function CORS

_Date: 2025-10-18_

## Objectives

- Reduce duplication across admin server actions so system administrator
  permissions are enforced consistently and logged with shared context.
- Improve Supabase Edge Function ergonomics by centralising CORS handling and
  JSON responses to eliminate drift between handlers.
- Capture follow-up work for data access and staff UX to inform future
  iterations.

## Current Pain Points

1. **Ad-hoc admin guards** – `/app/(main)/admin/actions.ts` repeats
   `requireUserAndProfile` calls, log context setup, and role checks for every
   mutation. The duplication makes it easy to forget logging metadata or to
   diverge error messages when new actions ship.
2. **Manual CORS wiring** – Edge functions such as `payments-apply` and
   `ingest-sms` hand-roll `OPTIONS` handling and JSON responses. Headers drift
   (for example, missing `access-control-allow-origin` on success responses),
   creating inconsistent behaviour in browsers and harder to audit defaults.
3. **Fragmented follow-up signals** – There is no single place documenting next
   steps once guards and HTTP helpers land, so future work on SACCO data access
   and observability risks falling through the cracks.

## Refactor Scope

| Area                    | Refactor                                                                                                                                                                                                 | Notes |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Admin actions           | Introduce a reusable guard that updates log context, enforces allowed roles, and standardises permission errors. Apply it across admin server actions, including MFA bulk reset and OCR review pathways. |
| Supabase Edge functions | Add a shared HTTP helper for CORS + JSON responses and update `payments-apply` and `ingest-sms` to leverage it (covering both idempotent JSON responses and raw text pipelines).                         |
| Documentation           | Record this plan and later outcomes, including follow-up tasks for SACCO metadata caching, admin UX, and additional Supabase functions to migrate to the shared helper.                                  |

## Implementation Steps

1. **Guard helper** – Create `lib/admin/guard.ts` exporting
   `requireAdminContext` and `AdminPermissionError`, supporting optional allowed
   roles, metadata for denial logs, and fallback payloads for callers needing
   structured extras (e.g. MFA reset counts).
2. **Server actions** – Refactor `app/(main)/admin/actions.ts` to consume the
   guard helper, collapsing repeated `requireUserAndProfile` logic and aligning
   error handling. Ensure service-role vs session clients stay intentional via
   the helper's `clientFactory` hook.
3. **HTTP helper** – Add `supabase/functions/_shared/http.ts` with
   `corsHeaders`, `preflightResponse`, `jsonCorsResponse`, and
   `errorCorsResponse`. Update `payments-apply` and `ingest-sms` to remove
   inline CORS duplication and guarantee every response carries consistent
   headers.
4. **Reporting** – Produce a refactor report capturing completed work, impacts,
   and recommended follow-ups for future sprints.

## Out of Scope

- Moving dashboard queries to the `app.*` schema or introducing new SQL views.
- Shipping accessibility fixes for quick actions and admin UI.
- Reworking edge functions beyond `payments-apply` and `ingest-sms`.

## Risks & Mitigations

- **Risk**: Helper misconfiguration could swallow legitimate metadata required
  for auditing.
  - **Mitigation**: Propagate custom `logEvent` keys from existing actions so
    log streams remain unchanged.
- **Risk**: Edge functions returning new headers may impact cached clients.
  - **Mitigation**: Default headers mirror existing allowlists but expand to
    include both idempotency and signature headers for future parity.

## Follow-up Ideas

- Migrate remaining edge functions (`sms-inbox`, `parse-sms`, etc.) to the
  shared HTTP helper for uniform behaviour.
- Introduce typed mutation helpers to eliminate lingering `as any` casts when
  Supabase view generation catches up.
- Layer admin action metrics (success/error counters) once the guard
  centralisation is battle-tested.
