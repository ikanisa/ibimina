# Ibimina SACCO+ Platform

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
1. **Admin App (`apps/admin`)**: Staff-facing PWA for member management, loan processing, reports, and analytics. Includes Android mobile app configuration.
2. **Client App (`apps/client`)**: Member-facing PWA and Android app for account balance, transactions, loan applications, and payments.
3. **Website (`apps/website`)**: Public marketing website.
4. **Platform API (`apps/platform-api`)**: Backend API for external integrations like mobile money webhooks and SMS ingestion.

**Mobile Apps:**
- **Staff Mobile App (Android)**: Android app built with Capacitor from Admin PWA. Package: `rw.ibimina.staff`. Fully configured at `apps/admin/android/` with 6 native plugins.
- **Client Mobile App (Android & iOS)**: Native mobile apps built with Capacitor from Client PWA.
  - **Android**: Package `rw.ibimina.client`, configured at `apps/client/android/` with 16 native plugins (biometric authentication, SMS integration, USSD dialing, location services, background sync, camera, push notifications, haptics, barcode scanner, etc.).
  - **iOS**: Bundle ID `rw.ibimina.client`, configured for iOS 13+, supports 15 native plugins (Face ID/Touch ID, Taptic Engine, APNs, camera, push notifications, location, etc.). Requires macOS + Xcode to build.
  - Member-facing mobile banking experience with WhatsApp OTP, MoMo auto-sync (Android), and offline-first design.

**Key Features:**
- Multi-factor Authentication (MFA) with passkeys
- Progressive Web Apps (PWAs) with offline support
- Mobile money integration (MTN, Airtel)
- SMS transaction parsing and automation
- Loan application and approval workflows
- Real-time analytics and reporting
- Multi-language support (English, French, Kinyarwanda)
- Device authentication and biometrics
- AI-powered support agent
- Web push notifications
- NFC contactless payments (TapMoMo)
- Multi-country support (Rwanda, Senegal expansion ready)

**System Design Choices:**
- **Monorepo Structure**: Facilitates shared code, consistent tooling, and efficient development.
- **Supabase Integration**: Leverages Supabase for PostgreSQL, authentication, real-time capabilities, and edge functions.
- **PWA First**: Emphasizes offline capabilities and native-like experiences.
- **Modular Design**: Shared packages (`config`, `core`, `lib`, `ui`, `providers`, `locales`, `ai-agent`, `testing`) promote code reusability.
- **Comprehensive Testing**: Utilizes Playwright for E2E, tsx for unit, and pgTAP for database testing.
- **Internationalization**: Supports multiple languages.
- **Atlas Design System**: Implemented a consistent design system (`#0066FF` primary blue) across Admin and Client PWAs, ensuring unified UI/UX with modern components like `GradientHeader`, `GlassCard`, and `MetricCard`, and consistent styling for navigation, forms, and data display.

## External Dependencies
-   **Supabase**: PostgreSQL database, authentication (Supabase Auth), real-time subscriptions, Edge Functions.
-   **OpenAI**: AI-powered features.
-   **Resend**: Email sending service.
-   **Cloudflare Pages**: Deployment target for frontend applications.
-   **Cloudflare**: CDN.
-   **MTN & Airtel**: Payment provider adapters for mobile money integration.
-   **Capacitor**: Building native Android mobile apps.
-   **Workbox**: PWA offline capabilities.
## Recent Changes

### 2025-10-31: Client Mobile App (iOS) Implementation - COMPLETE

**iOS App Configuration:**
- ✅ **Capacitor iOS Setup**: Configured for iOS platform in `apps/client/`
- ✅ **App Identity**: Bundle ID `rw.ibimina.client`, App Name "Ibimina"
- ✅ **iOS Compatibility**: Min iOS 13.0, Target iOS 17.0
- ✅ **Atlas Branding**: Splash screen and status bar with Atlas Blue (#0066FF) theme
- ✅ **Server Connection**: Configured to connect to Replit dev server (customizable for production)
- ✅ **Native Plugins**: 15 Capacitor plugins configured for iOS
- ✅ **Documentation**: Created comprehensive iOS build guides:
  - `apps/client/BUILD_IOS_INSTRUCTIONS.md` - Complete build guide for macOS/Xcode
  - `apps/client/IOS_MOBILE_APP_README.md` - iOS-specific app documentation
  - `.github/workflows/build-ios-client-app.yml` - CI/CD for iOS builds (macOS runners)

**iOS-Specific Features:**
- 🍎 **Face ID / Touch ID**: Native biometric authentication
- 🎨 **Taptic Engine**: Advanced haptic feedback
- 📱 **iOS Share Sheet**: System-wide sharing
- 🔔 **APNs**: Apple Push Notifications
- 🌙 **Dark Mode**: Automatic iOS dark mode support
- 📲 **Universal Links**: Deep linking ready

**iOS Native Plugins:**
All 15 Capacitor plugins configured: Camera, Push Notifications, Local Notifications, Haptics, Face ID/Touch ID, Geolocation, Barcode Scanner, File System, Network, Share, Splash Screen, Status Bar, Keyboard, Toast, Device.

**Build Requirements:**
- macOS with Xcode 15+ required (iOS apps cannot be built on Windows/Linux)
- CocoaPods for dependency management
- Apple Developer account for device testing and App Store distribution

**Build Options Provided:**
1. **Local Build on macOS**: Step-by-step Xcode build instructions
2. **GitHub Actions**: Automated CI/CD workflow with macOS runners
3. **Cloud Mac Services**: Guides for MacinCloud, Codemagic alternatives

**Platform Differences from Android:**
- ❌ SMS Reading not supported (iOS restriction) - WhatsApp OTP used instead
- ❌ Background Service restricted - Push notifications used instead
- ✅ Face ID / Touch ID native implementation
- ✅ Taptic Engine for advanced haptics
- ✅ APNs for push notifications

**Note**: iOS builds require macOS with Xcode. Documentation provides comprehensive guides for local building, CI/CD automation, and cloud build services for users without Macs.
