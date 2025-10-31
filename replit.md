# Ibimina SACCO+ Platform - Replit Migration

## Overview

**Project**: Ibimina - SACCO (Savings and Credit Cooperative) Management Platform  
**Repository**: https://github.com/ikanisa/ibimina  
**Migration Date**: October 31, 2025  
**Status**: In Migration to Replit Environment

## Purpose

Ibimina is a comprehensive digital platform for managing Savings and Credit Cooperatives (SACCOs) in Rwanda and across Africa. The platform provides:

- **Staff/Admin PWA**: For SACCO administrators to manage members, loans, transactions, and reports
- **Client PWA & Mobile Apps**: For SACCO members to view balances, apply for loans, make payments
- **Website**: Public-facing marketing and information website
- **Backend API**: For external integrations, mobile money webhooks, SMS processing

## Technology Stack

### Frontend Applications
- **Framework**: Next.js 15+ (App Router) with React 19
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS v4
- **Mobile**: Capacitor 7 (Android apps in Kotlin/Java)
- **PWA**: Service Workers with Workbox for offline support

### Backend & Database
- **Database**: PostgreSQL (via Supabase)
- **API**: Next.js API routes + Supabase Edge Functions (Deno)
- **Authentication**: Supabase Auth with MFA, passkeys, biometrics
- **Real-time**: Supabase Realtime subscriptions

### Build Tools
- **Package Manager**: pnpm 10.19 (workspaces)
- **Monorepo**: pnpm workspaces with 3 apps + 7 shared packages
- **Type Checking**: TypeScript with strict mode
- **Linting**: ESLint 9 + Prettier
- **Testing**: Playwright (E2E), tsx (unit tests), pgTAP (database)

## Project Structure

```
ibimina/
├── apps/
│   ├── admin/          # Staff/Admin PWA (Next.js) - PORT 5000
│   ├── client/         # Client PWA + Android app - PORT 5001
│   ├── platform-api/   # Backend API for integrations
│   └── website/        # Marketing website - PORT 5002
├── packages/
│   ├── config/         # Environment configuration & validation
│   ├── core/           # Core business logic & domain models
│   ├── lib/            # Shared utilities (security, logging, PII)
│   ├── ui/             # Shared React components
│   ├── providers/      # Payment provider adapters (MTN, Airtel)
│   ├── locales/        # Internationalization (en, fr, rw)
│   ├── ai-agent/       # AI-powered support agent
│   └── testing/        # Test utilities & fixtures
├── supabase/
│   ├── migrations/     # 80+ database migrations
│   ├── functions/      # 30+ Edge Functions (Deno)
│   └── tests/          # Database & RLS tests
├── feature-tapmomo/    # NFC payment feature (Android module)
├── infra/              # Infrastructure code (Terraform, Docker, Caddy)
├── docs/               # Comprehensive documentation
└── scripts/            # Build & deployment automation
```

## Applications

### 1. Admin App (`apps/admin`)
- **Purpose**: Staff-facing administration panel
- **Port**: 5000 (development)
- **Features**: Member management, loan processing, reports, analytics, MFA
- **Entry**: `apps/admin/app/page.tsx`
- **Run**: `cd apps/admin && pnpm dev`

### 2. Client App (`apps/client`)
- **Purpose**: Member-facing PWA and mobile apps
- **Port**: 5001 (development)
- **Features**: Account balance, transactions, loan applications, payments
- **Mobile**: Android APK via Capacitor (`android/` directory)
- **Entry**: `apps/client/app/page.tsx`
- **Run**: `cd apps/client && pnpm dev`

### 3. Website (`apps/website`)
- **Purpose**: Public marketing website
- **Port**: 5002 (development)
- **Features**: About, features, pricing, contact, SACCO directory
- **Entry**: `apps/website/app/page.tsx`
- **Run**: `cd apps/website && pnpm dev`

### 4. Platform API (`apps/platform-api`)
- **Purpose**: Backend API for external services
- **Features**: Mobile money webhooks, SMS ingestion, scheduled jobs
- **Entry**: `apps/platform-api/src/index.ts`

## Database

### PostgreSQL via Replit Database
- **Schema**: 80+ migrations defining tables, RLS policies, functions
- **Key Tables**:
  - `auth.users` - User accounts (Supabase Auth)
  - `public.saccos` - SACCO organizations
  - `public.ikimina_members` - SACCO members
  - `public.ledger_entries` - Financial transactions
  - `public.payments` - Payment records
  - `public.loans` - Loan applications
  - `authx.*` - MFA, passkeys, trusted devices

### Migrations
- Located in: `supabase/migrations/`
- Must be run in chronological order
- Use PostgreSQL transaction blocks

## Environment Variables

### Required Secrets (User Must Provide)
1. **Supabase Configuration**:
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public/anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only)

2. **Encryption Keys** (Generate with `openssl rand -base64 32`):
   - `KMS_DATA_KEY` - Master encryption key
   - `BACKUP_PEPPER` - Password hashing pepper
   - `MFA_SESSION_SECRET` - MFA session signing
   - `TRUSTED_COOKIE_SECRET` - Trusted device tokens
   - `HMAC_SHARED_SECRET` - Webhook signatures

3. **Optional Services**:
   - `OPENAI_API_KEY` - For AI-powered features
   - `RESEND_API_KEY` - For email sending
   - Web Push VAPID keys (for notifications)

### Configuration Files
- `.env` - Local development (never commit)
- `.env.example` - Template with all variables
- `packages/config/src/env.ts` - Zod validation schema

## Development Workflow

### Initial Setup
```bash
# 1. Install dependencies
pnpm install

# 2. Build shared packages
pnpm --filter @ibimina/core run build
pnpm --filter @ibimina/config run build
pnpm --filter @ibimina/lib run build
pnpm --filter @ibimina/ui run build

# 3. Set up database (migrations already run)
# 4. Configure .env file
# 5. Start admin app
cd apps/admin && pnpm dev
```

### Running Applications
- **Admin**: `pnpm --filter @ibimina/admin run dev` (port 5000)
- **Client**: `pnpm --filter @ibimina/client run dev` (port 5001)
- **Website**: `pnpm --filter @ibimina/website run dev` (port 5002)

### Building for Production
```bash
pnpm run build  # Builds all apps and packages
```

## Android Mobile Apps

### Client App (Android)
- **Location**: `apps/client/android/`
- **Technology**: Capacitor 7 + Kotlin/Java
- **Build**:
  1. `cd apps/client`
  2. `pnpm run cap:sync` - Sync web assets to native
  3. `pnpm run android:build:debug` - Build debug APK
  4. `pnpm run android:build:release` - Build release APK

### Admin App (Android)
- **Location**: `apps/admin/android/`
- **Similar build process to Client app**

### TapMoMo Feature (NFC Payments)
- **Location**: `feature-tapmomo/`
- **Technology**: Kotlin with NFC support
- **Purpose**: Contactless mobile money payments

## Key Features Implemented

✅ Multi-factor Authentication (MFA) with passkeys  
✅ Progressive Web Apps (PWAs) with offline support  
✅ Mobile money integration (MTN, Airtel)  
✅ SMS transaction parsing and automation  
✅ Loan application and approval workflows  
✅ Real-time analytics and reporting  
✅ Multi-language support (English, French, Kinyarwanda)  
✅ Device authentication and biometrics  
✅ AI-powered support agent  
✅ Web push notifications  
✅ NFC contactless payments (TapMoMo)  
✅ Multi-country support (Rwanda, Senegal expansion ready)

## Replit-Specific Configuration

### Workflows
- **Primary**: Admin app on port 5000 (staff interface)
- **Secondary**: Client app on port 5001 (member interface)
- **Tertiary**: Website on port 5002 (public site)

### Database
- Using Replit's built-in PostgreSQL database
- Connection via `DATABASE_URL` environment variable

### Deployment
- Configured for Cloudflare Pages deployment
- Alternative: Vercel, Netlify
- Database: Supabase (production) or Replit Database (development)

## Documentation

### Key Documents (in `docs/`)
- `PROJECT_STRUCTURE.md` - Detailed architecture
- `ENV_VARIABLES.md` - Environment variable reference
- `GROUND_RULES.md` - Development best practices
- `AUTHENTICATION_GUIDE.md` - Auth implementation
- `DB_GUIDE.md` - Database procedures
- `TESTING.md` - Testing strategy
- `DEPLOYMENT_TODO.md` - Production checklist

### Implementation Guides
- `ANDROID_IMPLEMENTATION_GUIDE.md` - Android app setup
- `SMS_INGESTION_GUIDE.md` - SMS processing
- `DEVICE_AUTHENTICATION.md` - Device auth system
- `MULTI_COUNTRY_ARCHITECTURE.md` - Multi-country expansion

## User Preferences

### Coding Style
- TypeScript with strict mode enabled
- Functional programming with React hooks
- Zod for runtime validation
- No comments unless necessary (self-documenting code)
- Consistent formatting with Prettier

### Deployment Preferences
- Primary: Cloudflare Pages (staff and client apps)
- Database: Supabase (PostgreSQL + Edge Functions)
- CDN: Cloudflare
- Monitoring: Log drain + analytics

## Recent Changes

### 2025-10-31: Migration to Replit
- Cloned repository from GitHub (ikanisa/ibimina)
- Setting up Replit environment
- Configuring PostgreSQL database
- Installing dependencies and building packages
- Setting up workflows for development

## Next Steps

1. ✅ Repository cloned
2. ⏳ Install dependencies (pnpm install)
3. ⏳ Set up PostgreSQL database
4. ⏳ Run database migrations
5. ⏳ Configure environment variables
6. ⏳ Build shared packages
7. ⏳ Start Admin app workflow
8. ⏳ Verify all features functional
9. ⏳ Configure deployment settings
10. ⏳ Test Android app builds

## Notes

- The project uses pnpm workspaces - always use `pnpm` not `npm`
- Database migrations must run in order (chronological filenames)
- RLS (Row Level Security) is critical - never bypass in client code
- Admin app is the primary interface - prioritize this for setup
- Android apps require Java/Kotlin toolchain (Gradle + Android SDK)
- All apps configured to run on port 5000 by default (adjust for multiple)

## Support

- **Repository**: https://github.com/ikanisa/ibimina
- **Documentation**: `docs/` directory
- **Issues**: Check `docs/TROUBLESHOOTING.md`

---

**Last Updated**: 2025-10-31  
**Migrated By**: Replit Agent  
**Environment**: Replit Development
