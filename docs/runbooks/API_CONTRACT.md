# API Contract Runbook

This runbook documents the key HTTP endpoints exposed by the staff console
(`apps/admin/app/api/*`). All routes return JSON payloads and require Supabase
session cookies unless explicitly marked public.

## 1. Authentication & MFA

| Route                           | Method | Description                                                                                               | Auth                                | Handler                                                                                                                 |
| ------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `/api/authx/challenge/initiate` | POST   | Start an MFA factor (passkey, TOTP, email, WhatsApp). Returns challenge payload for the requested factor. | Supabase session cookie             | `apps/admin/app/api/authx/challenge/initiate/route.ts`【F:apps/admin/app/api/authx/challenge/initiate/route.ts†L1-L40】 |
| `/api/authx/challenge/verify`   | POST   | Verify MFA token, enforce rate limits, and issue trusted device cookies.                                  | Supabase session + verified profile | `apps/admin/app/api/authx/challenge/verify/route.ts`【F:apps/admin/app/api/authx/challenge/verify/route.ts†L1-L160】    |
| `/api/authx/factors/list`       | GET    | List enrolled MFA factors for the current user.                                                           | Supabase session                    | `apps/admin/app/api/authx/factors/list/route.ts`【F:apps/admin/app/api/authx/factors/list/route.ts†L1-L18】             |

## 2. Device Authentication

| Route                      | Method | Description                                                                                             | Handler                                                                                                      |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `/api/device-auth/enroll`  | POST   | Register a new trusted device (WebAuthn key + integrity attestation). Returns enrolled device metadata. | `apps/admin/app/api/device-auth/enroll/route.ts`【F:apps/admin/app/api/device-auth/enroll/route.ts†L1-L120】 |
| `/api/device-auth/verify`  | POST   | Validate device challenge responses during login.                                                       | `apps/admin/app/api/device-auth/verify/route.ts`【F:apps/admin/app/api/device-auth/verify/route.ts†L1-L200】 |
| `/api/device-auth/devices` | GET    | List trusted devices for the current user, with revoke metadata.                                        | `apps/admin/app/api/device-auth/devices/route.ts`                                                            |

## 3. SACCO & Group Management

| Route              | Method | Description                                                     | Handler                                                                                        |
| ------------------ | ------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/api/groups`      | GET    | Fetch Ikimina groups scoped to the caller's SACCO memberships.  | `apps/admin/app/api/groups/route.ts`【F:apps/admin/app/api/groups/route.ts†L1-L48】            |
| `/api/memberships` | GET    | Fetch member roster for SACCO staff (filters by SACCO/role).    | `apps/admin/app/api/memberships/route.ts`                                                      |
| `/api/orgs/search` | GET    | Autocomplete organisations (districts, MFIs) for admin tooling. | `apps/admin/app/api/orgs/search/route.ts`                                                      |
| `/api/admin/staff` | GET    | Admin-only staff roster search by role/SACCO/status.            | `apps/admin/app/api/admin/staff/route.ts`【F:apps/admin/app/api/admin/staff/route.ts†L1-L160】 |

## 4. Payments & Reconciliation

| Route                         | Method | Description                                                                           | Handler                                                                                                              |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/api/reconciliation/suggest` | POST   | Request AI-generated reconciliation suggestions for a payment (requires SACCO scope). | `apps/admin/app/api/reconciliation/suggest/route.ts`【F:apps/admin/app/api/reconciliation/suggest/route.ts†L1-L160】 |
| `/api/reports/export`         | GET    | Stream CSV payment exports filtered by SACCO/Ikimina/date window with role checks.    | `apps/admin/app/api/reports/export/route.ts`【F:apps/admin/app/api/reports/export/route.ts†L1-L140】                 |
| `/api/reports/preview`        | POST   | Generate PDF previews for board-ready reports.                                        | `apps/admin/app/api/reports/preview/route.ts`                                                                        |
| `/api/pay/queue`              | POST   | Queue manual payment actions for workers.                                             | `apps/admin/app/api/pay/queue/route.ts`                                                                              |

## 5. Activity & Onboarding

| Route                  | Method | Description                                                             | Handler                                                                                               |
| ---------------------- | ------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/api/activity/recent` | GET    | Fetch latest join requests and activity for current user (10 item cap). | `apps/admin/app/api/activity/recent/route.ts`【F:apps/admin/app/api/activity/recent/route.ts†L1-L36】 |
| `/api/onboard`         | POST   | Create new member onboarding tasks.                                     | `apps/admin/app/api/onboard/route.ts`                                                                 |
| `/api/invite`          | POST   | Send staff invitations with scoped roles.                               | `apps/admin/app/api/invite/route.ts`                                                                  |

## 6. Health & Diagnostics

| Route                        | Method | Description                                                                     | Handler                                                                               |
| ---------------------------- | ------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `/api/health`                | GET    | Dependency health check (database latency + auth). Returns HTTP 503 on failure. | `apps/admin/app/api/health/route.ts`【F:apps/admin/app/api/health/route.ts†L1-L80】   |
| `/api/healthz`               | GET    | Lightweight heartbeat with build metadata for probes.                           | `apps/admin/app/api/healthz/route.ts`【F:apps/admin/app/api/healthz/route.ts†L1-L40】 |
| `/api/e2e/automation-health` | GET    | Synthetic checks for QA pipelines.                                              | `apps/admin/app/api/e2e/automation-health/route.ts`                                   |

## 7. Response Conventions

- All endpoints respond with JSON bodies and set appropriate status codes (4xx
  for validation/permission errors, 5xx for server failures).
- Supabase session cookies are required unless the route is explicitly under
  `/api/health` or `/api/e2e/*`.
- Rate limiting and auditing are implemented in authentication routes using
  `applyRateLimit` and audit helpers to track suspicious
  activity.【F:apps/admin/app/api/authx/challenge/verify/route.ts†L59-L130】【F:apps/admin/lib/observability/logger.ts†L1-L170】

Update this contract whenever you add, rename, or change the semantics of a
route so downstream clients and QA suites remain accurate.
