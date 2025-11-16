# Launch-Day Checklist (Technical, Operational, Communications)

Source: tailored from `GO_LIVE_CHECKLIST.md` plus production readiness reviews.

## T-1 Day Dry Run (Completed 2025-02-16)

- ✅ Dev server rebuilt from scratch; no blocking errors.
- ✅ Browser validation across Chrome, Edge, Safari (desktop + mobile
  responsive).
- ✅ Authentication flow exercised with test credentials.
- ✅ Bundle inspection confirms size budgets (<250 KB main bundle).
- ✅ Production build executed via
  `NODE_ENV=production pnpm --filter @ibimina/staff-admin-pwa build` with no
  warnings.
- ✅ Security sweep for embedded secrets + `pnpm audit --production` review.
- ✅ Lighthouse + bundle analysis executed; scores ≥ 90/90/90/85.

## Launch-Day Technical Checklist

1. **Environment Sanity**
   - Flush CDN cache and redeploy latest artifact.
   - Confirm `.env.production` matches vault secrets.
2. **Application Health**
   - Restart pods, monitor cold start logs for 15 minutes.
   - Validate service worker registration and offline cache warm-up.
3. **Authentication**
   - Spot test login/logout + MFA fallback.
   - Verify protected routes return 302 for anonymous users.
4. **Data Integrity**
   - Execute smoke queries (members count, loan approvals) and compare vs
     staging snapshot.
   - Ensure scheduled exports enabled post migration.
5. **Performance**
   - Capture initial Lighthouse run post go-live; store JSON in
     `artifacts/lighthouse/launch-day`.

## Operational Checklist

1. Staff command center staffed 08:00-20:00 CAT.
2. Training tracker updated with any escalations from live usage.
3. Support rotas and escalation tree printed + posted in war room.
4. Daily standups at 09:00 and 17:00 with notes logged in Confluence.
5. SLA monitors configured for onboarding, loan approval, payments modules.

## Communications Checklist

1. Publish go-live announcement via internal Slack `#launch` and email to
   leadership.
2. Update status page to "Production Available" once smoke tests pass.
3. Send knowledge base links (manuals, slide decks, videos) to all staff.
4. Capture screenshots + metrics for executive daily brief.
5. Socialize support channels (ServiceNow queue IDs) to avoid shadow IT.

## Sign-off Matrix

| Area           | Owner            | Status | Timestamp        |
| -------------- | ---------------- | ------ | ---------------- |
| Technical      | Engineering Lead | ✅     | 2025-02-17 07:45 |
| Operations     | Head of Ops      | ✅     | 2025-02-17 07:50 |
| Communications | Comms Director   | ✅     | 2025-02-17 07:55 |
