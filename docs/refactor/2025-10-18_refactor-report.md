# Refactor Report — Admin Guardrails & Edge Function CORS

_Date: 2025-10-18_

## Summary

- Introduced `lib/admin/guard.ts` to centralise admin permission checks,
  log-context initialisation, and client selection for server actions.
- Refactored `app/(main)/admin/actions.ts` to consume the shared guard,
  eliminating repeated `requireUserAndProfile` calls and aligning error handling
  across notifications, SACCO registry management, MFA resets, and OCR review.
- Added `supabase/functions/_shared/http.ts` to provide reusable CORS-aware
  helpers and migrated `payments-apply` plus `ingest-sms` to the new utilities
  for consistent browser responses.

## Impact

- **Consistency**: All admin mutations now emit identical denial logs and return
  messages, reducing the risk of inconsistent copy or missing instrumentation
  when new actions are added.
- **Security posture**: Service-role vs session-bound Supabase clients are
  explicitly chosen per action, preserving existing behaviour while making the
  intent readable.
- **Edge reliability**: Every response from `payments-apply` and `ingest-sms`
  now carries CORS headers, fixing the previous gap where success payloads
  omitted `Access-Control-Allow-Origin` and aligning error JSON structures.

## Follow-up Recommendations

1. Extend the guard helper with metrics (success/error counters) once production
   traffic is available to confirm patterns.
2. Migrate remaining edge functions (`sms-inbox`, `parse-sms`, `reports-export`,
   etc.) to `_shared/http.ts` to complete the CORS unification.
3. Pair the guard refactor with generated Supabase view types to remove the
   remaining `as any` casts inside admin mutations once schema generation
   catches up.

## Testing

- `pnpm lint`
- `pnpm test:unit`
- `pnpm test:auth`

_All commands executed locally; see terminal logs for run details._
