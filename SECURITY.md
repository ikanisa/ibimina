# Security Overview

Ibimina's security builds on Supabase RLS and standard authentication.

## Identity & Access

- Supabase Auth with email/password authentication
- Admin console routes rely on `requireUserAndProfile` guards
- GitHub SSO gated with branch protection and required reviews

## Data Protection

- RLS policies defined across `app.*`, `identity.*`, and `operations.*` schemas
- Encryption in transit via HTTPS-only domains and Supabase managed TLS
- Regular backups scheduled through Supabase

## Secrets & Configuration

- Environment variables documented in `.env.example`
- Supabase secrets synced via `supabase secrets set --env-file`

## Monitoring & Response

- Log drain feeds monitoring dashboards
- Incident triage and postmortem process documented in runbooks
