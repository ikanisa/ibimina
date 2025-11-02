# Deployment Runbooks

This playbook consolidates the operational steps that Ibimina engineers should
follow when deploying to production. It covers environment provisioning,
database lifecycle tasks, analytics/observability, and ongoing monitoring so we
can ship confidently to Vercel and Supabase.

---

## 1. Environment Variables

| Service  | Variable                        | Description                                                                                                 | Required | Default                   |
| -------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- | ------------------------- |
| Sentry   | `SENTRY_DSN`                    | Server-side DSN for the platform API workers and Next.js API routes.                                        | ✅       | –                         |
| Sentry   | `NEXT_PUBLIC_SENTRY_DSN`        | Browser DSN used by the admin console.                                                                      | ✅       | –                         |
| PostHog  | `POSTHOG_API_KEY`               | API key used for both Node (server) and Edge/browser clients.                                               | ✅       | –                         |
| PostHog  | `POSTHOG_HOST`                  | Override if self-hosting PostHog (defaults to `https://app.posthog.com`).                                   | ⛔️      | `https://app.posthog.com` |
| OpenAI   | `OPENAI_API_KEY`                | Optional for future LLM hand-off; present so the AI agent constructor can hydrate when we switch to OpenAI. | ⚠️       | empty                     |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`      | Supabase URL used by web clients.                                                                           | ✅       | –                         |
| Supabase | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key for Supabase client SDK.                                                                    | ✅       | –                         |
| Supabase | `SUPABASE_SERVICE_ROLE_KEY`     | Service role key for the platform API workers.                                                              | ✅       | –                         |

> **Secrets storage:** In Vercel, configure the web apps (`admin`, `client`) via
> the dashboard → _Settings → Environment Variables_. Platform API workers run
> on the Node target and should load the same secrets via your process manager
> (PM2, systemd) or Docker environment file.

---

## 2. Database Lifecycle

1. **Migrations**
   - Run `pnpm --filter @ibimina/platform-api run build` to emit the compiled
     workers.
   - Apply database migrations with `supabase db push` or the relevant SQL
     scripts checked into `supabase/migrations`.
   - Validate row level security with
     `pnpm --filter @ibimina/admin run test:rls`.

2. **Seed Scripts**
   - Initial tenant bootstrap lives in `supabase/seed.sql`. Execute via
     `supabase db reset --seed` for staging.
   - For production, use the idempotent seed script
     `scripts/seed-production.mjs` so re-runs don’t clobber data.

3. **Rollback Plan**
   - Capture a database snapshot before each deploy (`supabase db dump`).
   - If a migration fails, restore the snapshot and redeploy the previous worker
     release
     (`pnpm --filter @ibimina/platform-api run build && npm run deploy:cloudflare`
     as needed).

---

## 3. Application Deployment

### Admin (Next.js on Vercel)

1. `pnpm install`
2. `pnpm --filter @ibimina/admin run lint && pnpm --filter @ibimina/admin run typecheck`
3. `pnpm --filter @ibimina/admin run build`
4. `pnpm --filter @ibimina/admin run assert:lighthouse` (ensures Lighthouse ≥90
   for the chat page)
5. Deploy with `vercel --prod` or through GitHub integration (ensure preview
   passes `scripts/check-feature-flags.mjs`).

### Platform API Workers

1. `pnpm --filter @ibimina/platform-api run build`
2. Package the output (`dist/`) and deploy to the worker host (Cloudflare/Node
   runner).
3. Restart the service via `systemctl restart ibimina-platform` or
   `pm2 restart platform-api`.
4. Monitor logs via Sentry to confirm the new release is healthy.

### Client App

1. `pnpm --filter @ibimina/client run lint`
2. `pnpm --filter @ibimina/client run build`
3. Deploy to Vercel with the same environment variable set as Admin.

---

## 4. Monitoring & Dashboards

| Tool          | Dashboard                    | Purpose                                                                                                       |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Sentry        | `Ibimina / Admin Console`    | Tracks browser and API errors with PII scrubbing. Alerts on error spikes and rejected cross-tenant requests.  |
| Sentry        | `Ibimina / Platform Workers` | Captures worker failures, unhandled promise rejections, and performance traces.                               |
| PostHog       | `Admin Funnel`               | Funnel built on `chat_start → chat_stream_complete → ticket_created`. Used to validate AI support conversion. |
| PostHog       | `Tool Adoption`              | Breaks down `tool_used` events from dashboard quick actions.                                                  |
| Lighthouse CI | `Chat Page`                  | Automatically enforced via `pnpm --filter @ibimina/admin run assert:lighthouse`.                              |

Set up alerting rules so that:

- **PostHog** pings Slack when the chat TTFT median rises above 2 seconds.
- **Sentry** notifies #ops when an escalation (sensitive action) is triggered >3
  times within an hour.

---

## 5. Incident Response

1. **Detection** – Alerts from Sentry/PostHog trigger OpsGenie.
2. **Triage** – On-call engineer checks Sentry issue details (PII already
   scrubbed) and correlates with PostHog event timeline.
3. **Mitigation** – Roll back to the last successful build (`git revert` or
   redeploy from Vercel).
4. **Postmortem** – Log in `docs/incidents/YYYY-MM-DD.md` and update runbooks if
   new steps were required.

---

Keeping this playbook current is critical for a smooth Vercel deployment
pipeline. Update it whenever we add a new environment variable, service
dependency, or change deployment tooling.
