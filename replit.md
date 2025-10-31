# Ibimina SACCO+ Platform - Replit Migration

## Overview

Ibimina is a comprehensive digital platform designed for managing Savings and Credit Cooperatives (SACCOs) across Africa. Its purpose is to provide robust tools for SACCO administrators and members, fostering financial inclusion and efficient cooperative operations. The platform includes a Staff/Admin PWA, a Client PWA & Mobile Apps, a public-facing Website, and a Backend API for integrations. The project aims to digitize SACCO operations, improve member access to financial services, and facilitate growth in the cooperative sector.

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

## System Architecture

The Ibimina platform is a monorepo built with pnpm workspaces, consisting of three main applications and several shared packages.

**Technology Stack:**
- **Frontend**: Next.js 15+ (App Router), React 19, TypeScript 5.9, Tailwind CSS v4, Capacitor 7 (for mobile apps), Workbox (PWA offline support).
- **Backend & Database**: PostgreSQL (via Supabase), Next.js API routes, Supabase Edge Functions (Deno), Supabase Auth (MFA, passkeys, biometrics), Supabase Realtime.
- **Build Tools**: pnpm 10.19, TypeScript (strict mode), ESLint 9, Prettier, Playwright (E2E), tsx (unit tests), pgTAP (database).

**Core Applications:**
1.  **Admin App (`apps/admin`)**: Staff-facing PWA for member management, loan processing, reports, and analytics. Runs on port 5000.
2.  **Client App (`apps/client`)**: Member-facing PWA and Android app for account balance, transactions, loan applications, and payments. Runs on port 5001.
3.  **Website (`apps/website`)**: Public marketing website. Runs on port 5002.
4.  **Platform API (`apps/platform-api`)**: Backend API for external integrations like mobile money webhooks and SMS ingestion.

**Key Features Implemented:**
-   Multi-factor Authentication (MFA) with passkeys
-   Progressive Web Apps (PWAs) with offline support
-   Mobile money integration (MTN, Airtel)
-   SMS transaction parsing and automation
-   Loan application and approval workflows
-   Real-time analytics and reporting
-   Multi-language support (English, French, Kinyarwanda)
-   Device authentication and biometrics
-   AI-powered support agent
-   Web push notifications
-   NFC contactless payments (TapMoMo)
-   Multi-country support (Rwanda, Senegal expansion ready)

**System Design Choices:**
-   **Monorepo Structure**: Facilitates shared code, consistent tooling, and efficient development across multiple applications.
-   **Supabase Integration**: Leverages Supabase for PostgreSQL, authentication, real-time capabilities, and edge functions, providing a scalable and secure backend.
-   **PWA First**: Emphasizes offline capabilities and native-like experiences for both staff and members.
-   **Modular Design**: Shared packages (`config`, `core`, `lib`, `ui`, `providers`, `locales`, `ai-agent`, `testing`) promote code reusability and maintainability.
-   **Comprehensive Testing**: Utilizes Playwright for E2E, tsx for unit, and pgTAP for database testing to ensure reliability.
-   **Internationalization**: Supports multiple languages to cater to diverse user bases.

## External Dependencies

-   **Supabase**: Provides PostgreSQL database, authentication services (Supabase Auth), real-time subscriptions, and Edge Functions.
-   **OpenAI**: Used for AI-powered features within the platform (requires `OPENAI_API_KEY`).
-   **Resend**: Email sending service (requires `RESEND_API_KEY`).
-   **Cloudflare Pages**: Intended deployment target for frontend applications.
-   **Cloudflare**: Used as a CDN.
-   **MTN & Airtel**: Payment provider adapters for mobile money integration.
-   **Capacitor**: Enables building native Android mobile apps from web code.
-   **Workbox**: Used for PWA offline capabilities.

## Recent Changes

### 2025-10-31: Phase 2 - Atlas Design System Rollout (Admin & Client PWAs) - COMPLETE

**Admin PWA Redesign (100% Complete):**
- ✅ **Shared UI Components** (`packages/ui/src/components/`):
  - `GradientHeader`: Atlas blue gradient (from-atlas-blue to-atlas-blue-dark) with grid pattern overlay
  - `GlassCard`: Clean white cards with Atlas borders, shadow-atlas effects, hover transitions, dark mode support
  - `MetricCard`: Atlas-styled KPI cards with contextual accent colors (blue/amber/emerald/neutral), WCAG AA contrast
- ✅ **Admin Navigation** (`apps/admin/components/admin/panel/panel-shell.tsx`):
  - Sidebar nav links with Atlas blue active states (bg-atlas-blue), shadow-atlas effects
  - Hover states with atlas-blue/5 background, smooth transitions
  - Mobile nav button with Atlas blue styling and shadow effects
  - Accessibility improvements: ESC key handler, click outside to close, ARIA labels, role attributes
  - Modern badge styling for alerts (red/amber/blue/emerald with proper contrast)
- ✅ **Admin Layout**:
  - Clean neutral gradient background (from-neutral-50 to-neutral-100)
  - White sidebar with neutral borders, full dark mode support
  - ALL 25+ admin pages automatically use Atlas design via shared components

**Client PWA Redesign (100% Complete - All 15 Pages):**
- ✅ **Welcome Page** (`(auth)/welcome`): Atlas gradient icon, emerald checkmarks, Atlas blue CTAs
- ✅ **Onboarding Page** (`(auth)/onboard`): Atlas header icon, modern spacing, clean layout
- ✅ **Loans Page**: GradientHeader, Atlas loading states, neutral text colors
- ✅ **Wallet Page**: Atlas blue filters (removed purple), proper active states, shadow-atlas cards
- ✅ **Support Page**: Atlas gradient background, modern contact cards
- ✅ **Pay Sheet Page**: GradientHeader, Atlas USSD buttons, contextual status badges (amber/emerald/red)
- ✅ **Offline Page**: Atlas buttons, WifiOff icon, modern error states
- ✅ **Home Page** (`home/page.tsx`): Dashboard with KPI cards, loan status, all purple/orange tokens replaced with Atlas colors
- ✅ **Groups Page** (`groups/page.tsx`): Group list with redesigned GroupCard component using Atlas borders and hover effects
- ✅ **Group Members Page** (`groups/[id]/members/page.tsx`): Member table view with Atlas table styling, emerald status badges
- ✅ **Pay Page** (`pay/page.tsx`): USSD payment instructions with Atlas blue buttons and modern layout
- ✅ **Statements Page** (`statements/page.tsx`): Transaction history with contextual status badges (amber/emerald/red)
- ✅ **Profile Page** (`profile/page.tsx`): User settings with WhatsApp/MoMo integration, Atlas language buttons, help sections
- ✅ **Login Page** (`(auth)/login/page.tsx`): Complex 448-line WhatsApp OTP authentication flow, all custom tokens (neutral-0→neutral-900, neutral-1→neutral-600, neutral-2→neutral-400, neutral-9→neutral-50, rw-blue→atlas-blue, ink→white) migrated to Atlas
- ✅ **Root Page** (`page.tsx`): Redirect only, no styling needed

**Atlas Design Tokens Applied Consistently:**
- Primary color: Atlas Blue (#0066FF)
- Secondary: Atlas Blue Light (#3385FF), Atlas Blue Dark (#0052CC)
- Accents: Emerald (success), Amber (warning), Red (critical)
- Neutrals: neutral-50 through neutral-900 (replaced gray-*)
- Shadows: shadow-atlas (0 4px 16px rgba(0, 102, 255, 0.12))
- Transitions: duration-interactive (150ms), duration-smooth (300ms)
- Corners: rounded-2xl (16px) for cards, rounded-xl (12px) for buttons

**Design Consistency Achievement:**
- All Client PWA pages now match Admin PWA design language
- Consistent card patterns: border-neutral-200, bg-white, hover:border-atlas-blue/30, hover:shadow-atlas, hover:-translate-y-0.5
- Unified status badge pattern: amber-50/700 (pending), emerald-50/700 (completed), red-50/700 (failed)
- No legacy Tailwind tokens (gray-*, blue-*, green-*, yellow-*) remain in any main page
- WCAG AA contrast verified across all redesigned surfaces

### 2025-10-31: Phase 1 - Atlas Design Foundation
- ✅ Established ChatGPT Atlas design system (#0066FF primary blue)
- ✅ Created shared design tokens (colors, typography, spacing, animations)
- ✅ Updated Client PWA and Admin PWA global styles with Atlas palette
- ✅ Removed legacy color tokens and selection styles
- ✅ Applied modern system font stack across all apps
- ✅ Implemented smooth transitions and animations

### 2025-10-31: Navigation Improvements and i18n Fix
- ✅ Fixed Client PWA navigation - all pages load correctly
- ✅ Made group cards clickable to navigate to group detail pages
- ✅ Added bottom padding (pb-20) to all pages
- ✅ Simplified i18n middleware to fix 404 routing errors
- ✅ All 5 main navigation pages functional: Home, Groups, Pay, Statements, Profile
- ⚠️ Temporarily disabled server-side locale routing (hard-coded to "rw" default locale)

### 2025-10-31: Migration to Replit
- Cloned repository from GitHub (ikanisa/ibimina)
- Set up Replit environment
- Configured PostgreSQL database
- Installed dependencies and built packages
- Set up workflows for development