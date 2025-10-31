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