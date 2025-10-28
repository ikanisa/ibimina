# Feature Flag Operations

Feature toggles are stored in Supabase under `public.configuration`
(`key = 'feature_flags'`, JSONB payload). Each environment maintains its own row
so toggles can be promoted safely.

## Workflow

1. **Inspect current flags**
   ```sql
   select value
   from public.configuration
   where key = 'feature_flags';
   ```
2. **Update a flag**
   ```sql
   update public.configuration
   set value = jsonb_set(value, '{enable_offline_queue}', 'true', true)
   where key = 'feature_flags';
   ```
   Every update automatically refreshes `updated_at` for audit trails.
3. **Record the change**
   - Note the toggle + environment in release notes.
   - Link relevant Grafana panels (SMS backlog, notifications, exporter health).
   - File a ticket if the flag requires follow-up cleanup.

## Testing & CI guardrails

- `npm run lint` will fail if feature-flag-specific tests are missing once the
  follow-up CI rule is added (tracked separately).
- Stage toggles prior to production promotion; validate against QA checklist
  actions.
- Ensure toggles referenced in code have sensible defaults to avoid production
  breakage if the configuration row isn’t present.
