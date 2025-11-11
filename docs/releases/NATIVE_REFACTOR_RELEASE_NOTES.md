# Native Mobile Refactor — Release Notes

## Overview

The March 2025 native refactor establishes Kotlin/Swift-first mobile clients
while keeping the Next.js staff console as the administrative companion. The
TapMoMo shared protocol has been extracted into dedicated Kotlin modules and the
monorepo now tracks native-specific smoke tests alongside Supabase integration
checks.

## Testing recap

| Area                 | Command                                     | Result     | Evidence                                                                                                           |
| -------------------- | ------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| TapMoMo protocol     | `pnpm --filter @ibimina/tapmomo-proto test` | ✅ Pass    | Vitest suite covering signer/validator flows.【2a4151†L1-L17】                                                     |
| Supabase integration | `pnpm --filter @ibimina/admin run test:rls` | ⚠️ Blocked | Script exited early because `psql` is missing in the container image.【2ed58f†L1-L8】                              |
| Staff console build  | `pnpm --filter @ibimina/admin build`        | ❌ Fail    | Next.js build aborts with a missing `html5-qrcode` dependency referenced by the QR scanner route.【869fd8†L1-L16】 |

All results are mirrored in [TESTING_STATUS.md](../../TESTING_STATUS.md) for
quick reference.

## Outstanding work before merging to `main`

1. Install PostgreSQL client tooling (psql + libpq) in CI to unblock the RLS
   regression harness.
2. Reintroduce or replace the `html5-qrcode` package so App Router production
   builds complete successfully.
3. Align QR authentication docs with the new native-first QR handshake once the
   build issue is resolved.

## Capacitor/Ionic audit

Legacy hybrid wrappers have been inventoried; the only remaining executable
config files live under the former Capacitor shells:

```text
./apps/admin/capacitor.config.js
./apps/client/capacitor.config.ts
```

These files should be archived or removed once the Kotlin/Swift binaries are the
sole deployment target.【e84143†L1-L3】

## Deployment readiness

- The Kotlin TapMoMo stack is production-ready once the tests above stay green
  across CI.
- Native build instructions should point to the Kotlin/Swift repositories; the
  release checklist in `docs/go-live/` remains valid for the staff console.
- After closing the two outstanding items, tag a release candidate and open the
  merge-down PR to `main` with the updated test evidence.
