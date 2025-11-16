# Staging Operations Playbook

This runbook ties together the three operational tracks requested for the
current staging push: database seeding, build distribution with structured
feedback, and live monitoring of OTP/MoMo/bug-bash activity.

## 1. Seed Supabase staging with repeatable fixtures

1. Ensure the staging project has the latest migrations:
   ```bash
   cd supabase
   supabase db push --linked
   ```
2. Apply the consolidated seed (safe to re-run; it truncates only `Seed%`
   fixtures):
   ```bash
   psql "$STAGING_DATABASE_URL" -f supabase/seed/seed_multitenancy.sql
   ```
3. Verify the summary banner printed by the script – you should see counts for
   organizations, Ikimina, digital groups, loan products/applications, and
   TapMoMo transactions. Credentials are listed at the end and all accounts use
   `password123`.
4. Share the test matrix with QA so they can cover:
   - Platform roles (system/district/SACCO/MFI)
   - Client members exercising the new loan application flows
   - TapMoMo merchant + the three staged transactions

> **Tip:** When reseeding you can narrow troubleshooting by querying the new
> tables, e.g.
> `select ref, status from public.transactions where ref like 'SEED-%' order by created_at desc;`.

## 2. Distribute staging builds and capture feedback

### Build + upload matrix

| Surface         | Build command                                                             | Distribution notes                                                             |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Staff/Admin PWA | `pnpm --filter @ibimina/staff-admin-pwa build`                            | Publish to staging Cloudflare site, attach commit hash + Supabase release tag. |
| Client PWA      | `pnpm --filter @ibimina/client build`                                     | Push to Vercel/Netlify preview linked to staging Supabase.                     |
| Android client  | `pnpm build:client-android` (debug) / `pnpm build:client-android:release` | Upload signed APK to the shared Drive + Slack thread.                          |
| Staff Android   | `pnpm build:staff-android`                                                | Used by SACCO field teams; include device compatibility notes.                 |

After each build:

1. Post the artifact link, git SHA, and Supabase seed timestamp in the
   `#staging-rollout` Slack channel.
2. Confirm that QA + client champions can log in using the seed accounts
   (especially the new member + merchant identities).

### Feedback via GitHub Issues

All build feedback must land in GitHub with priority labels for triage:

1. Use the template below (copy/paste into a new issue):

   ```markdown
   ### Summary

   <one-line description>

   ### Repro

   1. …
   2. …

   ### Build info

   - Commit: <sha>
   - Env: staging
   - Surface: <pwa | android>

   ### Attachments

   - screenshots/logs
   ```

2. Apply one of `priority/p0`, `priority/p1`, `priority/p2` and add the
   `staging-feedback` label so dashboards can filter signal/noise.
3. Link fixes back to the issue number in PR titles/body.

## 3. Monitor OTP, MoMo, and bug-bash regressions

### WhatsApp OTP

- Tail the Supabase edge-function logs while QA exercises onboarding:
  ```bash
  supabase functions logs send-whatsapp-otp --tail 20
  supabase functions logs verify-whatsapp-otp --tail 20
  ```
- Spot-check database activity:
  ```sql
  select whatsapp_msisdn, channel, status, created_at
  from app.whatsapp_otp_codes
  order by created_at desc
  limit 20;
  ```
- If failures appear (`whatsapp_disabled`, `WHATSAPP_VERIFY_FAILED`), open a P0
  issue immediately and assign to the on-call full-stack owner.

### Mobile money (TapMoMo)

- Confirm merchant + transaction seeds exist:
  ```sql
  select display_name, network, merchant_code from public.merchants
  where display_name like 'Seed%';
  select ref, amount, status from public.transactions
  where ref like 'SEED-%' order by created_at desc;
  ```
- During live tests, keep `supabase functions logs reconcile --tail 50` running
  (if the reconciliation function is enabled) and reconcile any `failed`
  transactions back to `main` via PRs referencing the feedback issue.

### Bug-bash tracking + regression verification

1. Schedule a 30‑minute cadence review of newly opened `staging-feedback`
   issues.
2. For every fix:
   - Land the patch on a short-lived branch.
   - Run `pnpm lint && pnpm typecheck && pnpm test:unit` (or the
     surface-specific subset) before merging to `main`.
   - Include the issue link plus `Regression verified` notes in the PR body.
   - After merge, re-run the impacted flow on staging and update the issue with
     ✅/❌ plus evidence (screenshot/log excerpt).
3. Keep a simple dashboard (Notion/Sheet) with columns: `Issue`, `Priority`,
   `Owner`, `Fix merged?`, `Regression status?` so that leadership can confirm
   we are green before triggering deployment.

Following this playbook ensures staging seeds stay consistent, build feedback is
actionable, and every OTP/MoMo/bug-bash fix is audited before reaching
production.
