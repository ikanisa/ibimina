# SACCO+ Client App - World-Class Supa App Roadmap

## Executive Summary

This document outlines the implementation roadmap for transforming the SACCO+
Client App into a world-class "supa app" for ibimina on Android. The app follows
an intermediation-only model: no funds handling, no SACCO core integration—only
USSD contributions, reference tokens, and allocation-based statements.

## Current Status (Phase 1-3 Complete)

### ✅ Completed Features

1. **Core Architecture**
   - PWA with Next.js 15 + App Router
   - Capacitor 7.4.4 for Android wrapper
   - Service Worker with Workbox (SWR caching, offline fallback)
   - Digital Asset Links for TWA verification

2. **UI Components (World-Class)**
   - Bottom Navigation (Home, Groups, Pay, Statements, Profile)
   - USSD Sheet with tap-to-dial and copy functionality
   - Statements Table with filtering and export
   - Reference Card with QR placeholder
   - Join Request Dialog for group membership
   - All components WCAG 2.1 AA compliant (48px+ touch targets)

3. **Pages**
   - `/home` - Dashboard with group widgets and recent confirmations
   - `/groups` - Browse and join groups
   - `/pay` - USSD payment instructions with 3-step guide
   - `/statements` - Allocation-based transaction history
   - `/profile` - Contact info, language toggle, help links

4. **Accessibility**
   - Large touch targets (≥48px)
   - High contrast colors (4.5:1 minimum)
   - Icon-first navigation
   - ARIA labels on all interactive elements
   - Focus ring visibility
   - Skip-to-content link

5. **PWA Manifest**
   - Maskable icons (192px, 512px, 1024px)
   - Shortcuts for Pay, Groups, Statements
   - Standalone display mode
   - Theme color configured

### 🔄 In Progress

1. **Internationalization**
   - Setup next-intl for rw/en/fr
   - Translation files structure
   - Language switcher implementation

2. **Data Integration**
   - Wire up Supabase queries
   - Implement RLS policies
   - Replace mock data with real queries

## Phase 4: Internationalization (1-2 weeks)

### Goals

Enable Kinyarwanda, English, and French throughout the app with right-sized
translations.

### Tasks

1. **Setup next-intl**

   ```bash
   pnpm add next-intl
   ```

2. **Create Translation Files**

   ```
   apps/client/locales/
     en/
       common.json
       navigation.json
       payments.json
       statements.json
       profile.json
     rw/
       common.json
       ...
     fr/
       common.json
       ...
   ```

3. **Configure Middleware**

   ```typescript
   // apps/client/middleware.ts
   import createMiddleware from "next-intl/middleware";

   export default createMiddleware({
     locales: ["en", "rw", "fr"],
     defaultLocale: "rw",
   });
   ```

4. **Update Components**
   - Replace hardcoded strings with `useTranslations()`
   - Add locale switcher in profile page
   - Test all pages in all languages

5. **Glossary Consistency**
   - Maintain canonical terms across locales
   - Key financial terms translated accurately
   - Short labels for mobile (max 2-3 words)

### Acceptance Criteria

- [ ] All UI strings translatable
- [ ] Language switcher functional
- [ ] RTL-ready structure (for future)
- [ ] Translations reviewed by native speakers

## Phase 5: Data Access & Privacy (1-2 weeks)

### Goals

Wire up real data from Supabase with proper RLS enforcement and token-scoped
access.

### Tasks

1. **RLS Policies**

   ```sql
   -- Users can only see groups they're members of
   CREATE POLICY "members_view_groups"
   ON groups FOR SELECT
   USING (
     id IN (
       SELECT group_id FROM group_members
       WHERE user_id = auth.uid() AND status = 'APPROVED'
     )
   );

   -- Users can only see allocations matching their reference tokens
   CREATE POLICY "members_view_allocations"
   ON allocations FOR SELECT
   USING (
     reference_token IN (
       SELECT reference_token FROM member_reference_tokens
       WHERE user_id = auth.uid()
     )
   );
   ```

2. **API Routes**
   - `/api/me/groups` - Get user's approved groups
   - `/api/me/statements` - Get token-scoped allocations
   - `/api/me/profile` - Get user profile
   - `/api/groups/[id]/join` - Submit join request

3. **Auth Guards**
   - Protect all pages with auth check
   - Redirect unauthenticated to `/welcome`
   - Handle token refresh
   - Secure session management

4. **Data Fetching**
   - Replace mock data in pages
   - Use Server Components for initial data
   - Client Components for mutations
   - Optimistic UI updates

### Acceptance Criteria

- [ ] All RLS policies tested
- [ ] No service-role keys in client
- [ ] Auth guards on all protected routes
- [ ] Token-scoped data access verified

## Phase 6: Android SMS Ingestion (2-3 weeks)

### Goals

Enable device-level SMS reading for Mobile Money confirmations with Play Store
compliance.

### Option A: Notification Listener (Primary)

**Steps:**

1. Create NotificationListenerService in Android
2. Filter for MoMo app notifications
3. Extract transaction text
4. Bridge to WebView via Capacitor
5. Parse SMS and send to Edge Function

**See:** `SMS_INGESTION_GUIDE.md`

### Option B: SMS User Consent API (Secondary)

**Steps:**

1. Integrate Google SMS User Consent API
2. Trigger on "I've Paid" button
3. Request one-time SMS access
4. Parse retrieved SMS
5. Send to Edge Function

### Option C: GSM Modem (Fallback)

**Already Implemented:**

- Server-side GSM modem reads SMS centrally
- Posts to Edge Function
- Works for all users (PWA, denied permissions, etc.)

### Tasks

1. **Implement Notification Listener**
   - Android service code
   - Capacitor plugin bridge
   - Permission handling

2. **Client-Side Parser**
   - Regex for MTN, Airtel formats
   - Reference token decoder
   - Amount normalizer

3. **Edge Function Integration**
   - HMAC signing
   - POST to `/functions/v1/sms/ingest-device`
   - Error handling

4. **Testing**
   - Unit tests for parser
   - Integration tests with real SMS
   - Test on multiple Android versions

5. **Play Store Compliance**
   - Document permission usage
   - User-facing permission explanation
   - Submit declaration if needed

### Acceptance Criteria

- [ ] Notification Listener functional
- [ ] SMS parsing accurate (>95%)
- [ ] HMAC signing correct
- [ ] Edge Function receives and processes
- [ ] Allocations created automatically
- [ ] Play Store compliant

## Phase 7: Observability & Analytics (1 week)

### Goals

Monitor errors, track UX funnels, and measure adoption.

### Tasks

1. **Sentry Integration**

   ```bash
   pnpm add @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

   Configure:
   - Error tracking
   - Performance monitoring
   - Release tracking
   - PII scrubbing

2. **PostHog Setup**

   ```bash
   pnpm add posthog-js
   ```

   Track events:
   - USSD sheet opened
   - Reference copied
   - Payment marked as paid
   - Statement viewed
   - PDF exported
   - Language changed

3. **Funnels**
   - Pay Flow: Pay page → Copy reference → Dial USSD → Mark paid → Statement
     confirmed
   - Join Flow: Groups page → Join request → Pending → Approved → First payment
   - Statement Flow: Statements page → Filter → Export PDF

4. **Dashboards**
   - Daily active users
   - Payment volume
   - Error rates
   - Performance metrics (LCP, FID, CLS)

### Acceptance Criteria

- [ ] Sentry catching errors
- [ ] PostHog tracking events
- [ ] Funnels configured
- [ ] Alerts set up
- [ ] PII redacted in logs

## Phase 8: Performance & PWA Optimization (1 week)

### Goals

Achieve Lighthouse PWA/Perf/A11y ≥ 90 scores.

### Tasks

1. **Bundle Optimization**
   - Code splitting per route
   - Tree-shaking unused code
   - Dynamic imports for heavy components
   - Minify and compress

2. **Image Optimization**
   - Use Next.js Image component
   - Serve WebP/AVIF formats
   - Lazy load below fold
   - Responsive sizing

3. **Caching Strategy**
   - Pre-cache critical routes
   - SWR for API data
   - Cache-first for static assets
   - Network-first for pages

4. **Performance Budget**
   - TTI < 2.5s on 3G
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1
   - Bundle size < 200KB initial

5. **PWA Checklist**
   - [ ] Installable
   - [ ] Works offline
   - [ ] Fast on 3G
   - [ ] HTTPS only
   - [ ] Responsive design
   - [ ] Splash screen
   - [ ] Push notifications ready

### Acceptance Criteria

- [ ] Lighthouse PWA: ≥90
- [ ] Lighthouse Performance: ≥90
- [ ] Lighthouse Accessibility: ≥90
- [ ] Bundle size < 200KB
- [ ] TTI < 2.5s

## Phase 9: Testing & QA (2 weeks)

### Goals

Comprehensive test coverage and QA before production.

### Tasks

1. **Unit Tests**

   ```bash
   # Test utilities
   - SMS parser
   - Reference decoder
   - Currency formatter
   - Date formatter
   - Validation schemas (Zod)
   ```

2. **Integration Tests**

   ```bash
   # Test flows
   - Join group request
   - Payment submission
   - Statement filtering
   - PDF export
   - Language switching
   ```

3. **E2E Tests (Playwright)**

   ```typescript
   // Critical user journeys
   test("Pay flow", async ({ page }) => {
     await page.goto("/pay");
     await page.click('[data-testid="ussd-sheet"]');
     await page.click('[data-testid="copy-reference"]');
     await page.click('[data-testid="dial-ussd"]');
     await page.click('[data-testid="mark-paid"]');
     await expect(page.locator('[data-testid="pending-status"]')).toBeVisible();
   });
   ```

4. **Accessibility Audit**
   - Run axe-core
   - Test with screen readers
   - Verify keyboard navigation
   - Check color contrast
   - Test with reduced motion

5. **Manual Testing**
   - Test on low-end Android devices
   - Test on slow 3G network
   - Test with dual SIM
   - Test in different languages
   - Test offline mode

### Acceptance Criteria

- [ ] Unit test coverage > 80%
- [ ] All E2E tests passing
- [ ] Zero axe violations
- [ ] Manual QA sign-off
- [ ] Security review complete

## Phase 10: Build & Release (1 week)

### Goals

Package, deploy, and monitor initial release.

### Tasks

1. **TWA Build**

   ```bash
   # Generate TWA using Bubblewrap
   npx @bubblewrap/cli init --manifest https://app.sacco-plus.com/manifest.json
   npx @bubblewrap/cli build
   ```

2. **App Signing**
   - Generate release keystore
   - Sign APK/AAB
   - Update assetlinks.json with SHA256 fingerprint
   - Test signed build

3. **Play Store Listing**
   - App name: "SACCO+ Client"
   - Description (rw/en/fr)
   - Screenshots (5 per language)
   - Feature graphic
   - Privacy policy link
   - Terms of service link

4. **CI/CD Pipeline**

   ```yaml
   # .github/workflows/client-release.yml
   - Lint
   - Type check
   - Unit tests
   - E2E tests
   - Lighthouse audit
   - Build APK/AAB
   - Upload to Play Store
   ```

5. **Monitoring**
   - Crashlytics
   - Analytics dashboard
   - User feedback channel
   - Support documentation

6. **Rollout Strategy**
   - Alpha: Internal testers (10 users)
   - Beta: SACCO staff (50 users)
   - Production: Gradual rollout (10% → 50% → 100%)

### Acceptance Criteria

- [ ] TWA built and signed
- [ ] assetlinks.json verified
- [ ] Play Store listing live
- [ ] CI/CD pipeline working
- [ ] Monitoring dashboards ready
- [ ] Alpha testing successful
- [ ] Beta feedback incorporated

## Feature Prioritization

### P0 (Launch Blockers)

- ✅ Bottom navigation
- ✅ USSD payment flow
- ✅ Statements view
- ✅ Profile management
- 🔄 Internationalization (rw/en/fr)
- 🔄 RLS policies
- 🔄 Auth guards
- 📋 SMS ingestion

### P1 (Post-Launch, Q1)

- PDF export implementation
- QR code generation
- Push notifications
- Background sync
- Share functionality
- Search/filter groups
- Help/FAQ content

### P2 (Future Enhancements)

- Biometric authentication
- Dark mode
- CSV export
- Receipt scanning
- Loan requests
- Savings goals
- Group chat

## Success Metrics

### Technical

- Lighthouse scores ≥ 90
- Error rate < 1%
- API response time < 500ms
- App crashes < 0.1%
- Offline functionality 100%

### User Engagement

- DAU/MAU ratio > 40%
- Payment completion rate > 90%
- Statement export rate > 20%
- Average session duration > 5 min
- User retention (30-day) > 70%

### Business Impact

- Number of active groups
- Total payment volume
- SMS detection rate > 95%
- Support ticket reduction > 50%
- Staff approval time < 24hrs

## Risk Mitigation

### Technical Risks

- **SMS permissions denied**: Fallback to GSM modem + manual confirmation
- **Poor network**: Offline-first with sync queue
- **Low-end devices**: Progressive enhancement, performance budget
- **API failures**: Retry logic, graceful degradation

### Business Risks

- **User adoption**: Comprehensive onboarding, staff training
- **Data privacy**: RLS enforcement, PII minimization, audit logs
- **Compliance**: Play Store policies, financial regulations
- **Support load**: Self-service help, clear error messages

## Resources

### Team

- 1 Mobile Developer (Android/Capacitor)
- 1 Frontend Developer (React/Next.js)
- 1 Backend Developer (Supabase/Edge Functions)
- 1 QA Engineer
- 1 UI/UX Designer (part-time)
- 1 Product Owner

### Timeline

- Phase 4: 2 weeks
- Phase 5: 2 weeks
- Phase 6: 3 weeks
- Phase 7: 1 week
- Phase 8: 1 week
- Phase 9: 2 weeks
- Phase 10: 1 week

**Total: 12 weeks (3 months)**

### Dependencies

- Supabase project access
- Google Play Developer account
- SMS gateway (GSM modem)
- Real user testing group
- Translation services
- Design assets

## Next Actions (Immediate)

1. ✅ Create comprehensive SMS ingestion guide
2. ✅ Document implementation roadmap
3. 📋 Set up next-intl for i18n
4. 📋 Wire up Supabase data layer
5. 📋 Implement RLS policies
6. 📋 Start Android SMS feature
7. 📋 Set up Sentry + PostHog
8. 📋 Create E2E test suite

---

**Last Updated:** 2025-10-28  
**Status:** Phase 1-3 Complete, Phase 4 Starting  
**Next Milestone:** i18n + Data Integration (2 weeks)
