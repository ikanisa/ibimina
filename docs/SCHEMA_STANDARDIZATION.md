# Schema Standardization

## Current State

The Ibimina platform uses two primary schemas:

- **`public`**: Core tables including `users`, `members`, `payments`,
  `sms_inbox`
- **`app`**: Application-specific tables including `saccos`,
  `whatsapp_otp_codes`, `report_subscriptions`

## Goal

Standardize all application tables to use the `app` schema for consistency and
better organization.

## Approach

### Option 1: View-Based Migration (Recommended)

Create views in the `app` schema that point to `public` tables:

```sql
CREATE OR REPLACE VIEW app.users AS SELECT * FROM public.users;
CREATE OR REPLACE VIEW app.members AS SELECT * FROM public.members;
-- etc.
```

**Advantages:**

- Non-breaking change
- Allows gradual code migration
- Easy rollback

**Process:**

1. Create views in `app` schema
2. Update code gradually to use `app.table_name`
3. Once all code is updated, move actual tables
4. Drop views

### Option 2: Direct Table Migration

Move tables directly from `public` to `app`:

```sql
ALTER TABLE public.users SET SCHEMA app;
```

**Advantages:**

- Clean, final solution
- No intermediate views

**Disadvantages:**

- Breaking change
- Requires coordinated deployment
- Requires updating all code at once

## Migration File

See `supabase/migrations/20251128130000_standardize_schema.sql` for guidance.

**Note:** This migration is intentionally left as documentation only and should
not be applied automatically. It requires careful planning and coordination.

## Recommendation

Use **Option 1 (View-Based Migration)** for a safer, gradual transition. Only
proceed with Option 2 after all code has been updated to use the `app` schema.
