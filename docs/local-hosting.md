# Local hosting guide

This project reads environment variables from `.env.local` when you run `npm run dev` or `npm run start`. Copy the baseline file and keep your personal secrets out of version control:

```bash
cp .env.example .env.local
```

Update the Supabase values so they match your project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
BACKUP_PEPPER=<random-string>
MFA_SESSION_SECRET=<random-string>
TRUSTED_COOKIE_SECRET=<random-string>
HMAC_SHARED_SECRET=<random-string>
OPENAI_API_KEY=<api-key>
```

Use `.env.local` for every secret that the Next.js runtime reads. Supabase CLI commands still use the files inside `supabase/` (`supabase/.env`, `supabase/.env.production`, etc.), so keep those in sync if you rotate keys.

> `.env.local` is ignored by Git. If you need to share settings with other developers, commit a sanitized `.env.example` update instead of checking in your personal file.
