# Environment Matrix

| Lane       | Hostname / URL                       | Supabase Project         | Secrets Source                                   | Notes                                                   |
| ---------- | ------------------------------------ | ------------------------ | ------------------------------------------------ | ------------------------------------------------------- |
| Local      | `http://localhost:3100`              | `ibimina-local` (Docker) | `.env.local`, `supabase/.env`                    | Run `make dev` to start Next.js + local Supabase stack. |
| Preview    | `https://ibimina-preview.vercel.app` | Branch DB (`preview-*`)  | Vercel preview env vars                          | Auto-generated per PR; seeded via `supabase db branch`. |
| Staging    | `https://ibimina-staging.vercel.app` | `ibimina-staging`        | Vercel staging env; Supabase secrets set via CLI | Manual promotion target; gated by protected approvals.  |
| Production | `https://console.ibimina.rw`         | `ibimina-prod`           | Vercel production env; Supabase dashboard        | Requires completion of `GO_LIVE_CHECKLIST.md`.          |

## Secret Ownership

| Secret                              | Owner Squad   | Rotation Cadence | Storage                             |
| ----------------------------------- | ------------- | ---------------- | ----------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY`         | Platform      | Quarterly        | 1Password → Vercel/Supabase secrets |
| `TRUSTED_COOKIE_SECRET`             | Security      | Monthly          | 1Password → Vercel env vars         |
| `MFA_SESSION_SECRET`                | Security      | Monthly          | 1Password → Vercel env vars         |
| `LOG_DRAIN_TOKEN` / `LOG_DRAIN_URL` | SRE           | Quarterly        | Grafana → Vercel env vars           |
| `SENTRY_DSN` / `POSTHOG_API_KEY`    | Observability | Quarterly        | 1Password → Vercel env vars         |
| `EAS_ACCESS_TOKEN`                  | Mobile        | Quarterly        | 1Password → Expo secrets            |

## Database Branching

- Use `supabase db branch create preview-<pr-number>` for PR validation; destroy
  branches post-merge with `supabase db branch delete`.
- Staging mirrors production schema nightly via `scripts/sync-db.sh`.
- Production migrations apply through `supabase db remote commit` during release
  windows; capture diff output in release PR.

## Verification Commands

- `pnpm run check:deploy` — Web build, lint, typecheck, Playwright, Lighthouse.
- `pnpm --filter @ibimina/testing run test:rls` — RLS proof suite.
- `pnpm run supabase:types` — Regenerate typed clients after migrations.

Review this matrix monthly and whenever secrets rotate or hostnames change.
